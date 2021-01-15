import os
import re
from astropy.time import Time
from datetime import datetime
import pandas as pd
import MySQLdb
from dotenv import load_dotenv

load_dotenv()

dashboard_database_host = os.getenv("MYSQL_DATABASE_HOST")
dashboard_database_user = os.getenv("MYSQL_DATABASE_USER")
dashboard_database_password = os.getenv("MYSQL_DATABASE_PASSWORD")
dashboard_database_name = os.getenv("MYSQL_DATABASE_DB")

connection = MySQLdb.connect(
    host=dashboard_database_host,
    user=dashboard_database_user,
    passwd=dashboard_database_password,
    db=dashboard_database_name,
)


def get_telescope_id(telescope_name: str) -> int:
    """
    This function queries the dashboard database, specifically the telescopes table and get
    the id of a telescope based on its name. The telescope id is used in the dome_shutter_open_time
    table instead of the telescope's name.
    :param telescope_name: The name of each of the steerable telescopes
    :return: a telescope id which uniquely identifies each telescope
    """
    result = pd.read_sql(
        """SELECT telescope_id FROM Telescopes where telescope_name= %s""",
        connection,
        params=(telescope_name,),
    )
    return result["telescope_id"][0]


def get_dome_status_id(dome_status: str) -> id:
    """This function gets the status of the dome a telescope. The status of the dome
    we are interested in is OPEN and CLOSED. The other status are not relevant for the
    task at hand so if a telescope status is neither OPEN or CLOSED, it is UNKNOWN
    :param dome_status: The dome status of a telescope
    :return: the id of each status, OPEN,CLOSED and UNKNOWN
    """
    result = pd.read_sql(
        """SELECT id FROM dome_status where status= %s""",
        connection,
        params=(dome_status,),
    )
    return result["id"][0]


def convert_julian_date_to_iso_date(julian_date: float) -> datetime:
    """This function takes a julian date and returns the julian
       date as python datetime object"""
    log_file_date = Time(julian_date, scale="utc", format="jd")
    return log_file_date.to_datetime()


def insert_into_dome_shutter_open_time_table(
    file_julian_date: str,
    converted_julian_date: datetime,
    telescope_name: str,
    dome_status_id: int,
):
    """This function is for insertion into the dome_shutter_open_time table of the Dashboard database.
    We insert the julian date of each day, the converted julina date(in human readable form), the id of each telescope
    based on its name and the status of the dome based on whether it is OPEN,CLOSED or UNKNOWN
    :param file_julian_date: This date is read from the log files of each telescope
    :param converted_julian_date: The julian date of the log files is converted to a readable date using the
    'convert_julian_date_to_iso_date' method
    :param telescope_name: The name of each telescope used to get its unique id
    :param dome_status_id: The id of each status of the dome we are interested in
    :return: This function commits the data inserted into the 'dome_shutter_open time' table
    """
    with connection.cursor() as shutter_open_time_cursor:
        try:
            mysql_query = """
                        INSERT INTO dome_shutter_open_time(
                                                        julian_date,
                                                        converted_julian_date,
                                                        telescope_id,
                                                        dome_status_id)
                        VALUES(
                            %(julian_date)s,
                            %(converted_julian_date)s,
                            %(telescope_id)s,
                            %(dome_status_id)s)
                        ON DUPLICATE KEY UPDATE
                                                    julian_date =values(julian_date),
                                                    converted_julian_date =values(converted_julian_date),
                                                    telescope_id=values(telescope_id),
                                                    dome_status_id= values(dome_status_id);
                            """
            shutter_open_time_cursor.execute(
                mysql_query,
                dict(
                    julian_date=file_julian_date,
                    converted_julian_date=converted_julian_date,
                    telescope_id=int(get_telescope_id(telescope_name)),
                    dome_status_id=dome_status_id,
                ),
            )
            connection.commit()
        except Exception as e:
            raise e
        connection.rollback()


def dome_shutter_open_time(folder, telescope_name: str):
    """Function to populate the Shutter_open_time database table in the Dashboard database
    :param folder: The path to either the 40inch or 74inch telescope log file(latest file in the directory)
    :param telescope_name: The name of the telescope you reading the log file of.
    """
    dome_status_id = 0

    for file in os.listdir(folder):
        filepath = os.path.join(folder, file)

        """Reading all files in the specified directory"""
        try:
            with open(filepath, "rb") as log_file:
                log_file_content = log_file.readlines()

            """ Example of the file structure

                2458483.93407   17 36 10 -31 53 15  1.0000 18 27 30 1849 90 80.8   85.1 12  46  21 -28  53  01 0 0
                0.000000  17 35 17 -31 10 36
                @00FA0040000000010100400069000006D700003596184900060703000100001000000000000070400300000000400000900010000000003E*
                0

                The julian date is the first number in the file structure example and the hex string is the
                    one starting with the @ sign """

            """We loop through each file in the directory and read its contents.
                    The regular expression finds the julian date('2458483.93407')
                and the hex string(' @00FA0040000000010100400069000006D700003596') we need
                to find the status of the dome for each day
                """
            for information in log_file_content:

                line = information.decode("utf-8")

                file_content = re.match(r"^(\d{7}\.\d{5}).*(@[\dA-Z]+\*)", line)

                if file_content:

                    file_julian_date = file_content.groups()[0]

                    converted_julian_date = convert_julian_date_to_iso_date(
                        float(file_julian_date)
                    )

                    hex_string = file_content.groups()[1]
                    """The 'hex string' contains the information we need to get dome shutter open time.
                        The 'converted julian date' is the julian date read from the file in a datetime format.
                        'file_julian_date' is the julian date read straight from the file
                        'hex_string' is similar to the one in the example, its also taken from the file.
                    """

                    """The hex string read from the file can sometimes not contain the information
                        we need because it can be too short due some error so we get 'index out of bounds' because
                        of the portions of the string we need.
                        So to avoid that we check its length so we can read the correct portions we need"""

                    if len(hex_string) == 114:
                        telescope_status_word = hex_string[79:83]

                        building_status_word = hex_string[91:95]

                        """The telescope status word is the 4 digits from specified positions in the hex string,
                           from this we can tell if the telescope is on or off. If the telescope is off, we don't read
                            the hex string as the data may not be reliable. The building status word is the one which
                            tells if the dome is open or closed. Its also a 4 digit portion of the hex string"""

                        """The telescope_status_word and the building_status_word are read as strings(The strings are
                            in hex form) so we convert them to int first then to binary so we can perform binary
                            operations on the building_status_word and the telescope_status_word """

                        telescope_status_word_in_binary = bin(
                            int(telescope_status_word, 16)
                        )[2:]

                        building_status_word_in_binary = bin(
                            int(building_status_word, 16)
                        )[2:]

                        if (int(telescope_status_word_in_binary, 2) & 2048) >> 11 and (
                            int(building_status_word_in_binary, 2) & 32
                        ) >> 5:
                            dome_status_id = int(get_dome_status_id("OPEN"))

                        if (int(telescope_status_word_in_binary, 2) & 2048) >> 11 and (
                            int(building_status_word_in_binary, 2) & 16
                        ) >> 4:
                            dome_status_id = int(get_dome_status_id("CLOSED"))

                        if dome_status_id != int(
                            get_dome_status_id("OPEN")
                        ) and dome_status_id != int(get_dome_status_id("CLOSED")):
                            dome_status_id = int(get_dome_status_id("UNKNOWN"))

                        insert_into_dome_shutter_open_time_table(
                            file_julian_date,
                            converted_julian_date,
                            telescope_name,
                            dome_status_id,
                        )
        except UnicodeDecodeError:
            pass
    return "database population has been successful for {}".format(telescope_name)
