import pymysql.cursors
import re
import os
from datetime import datetime
from datetime import date
import pandas as pd
from dateutil import parser
from typing import Dict

# database connection

database_host = os.environ.get("database_host")
database_user = os.environ.get("user")
database_password = os.environ.get("password")
database_name = os.environ.get("database")

connection = pymysql.connect(
    host=database_host,
    user=database_user,
    port=3306,
    password=database_password,
    db=database_name,
)
cursor = connection.cursor()


def get_instrument_id(instrument_name: str) -> int:
    """ Getting the instrument id from the Instruments table in the database
    :param instrument_name: name of the instrument used in the observation week
    :return: an instrument id based on its name
    """
    result = pd.read_sql(
        """SELECT instrument_id FROM Instruments where instrument_name= %s """,
        connection,
        params=(instrument_name,),
    )
    return result["instrument_id"][0]


def get_telescope_id(telescope_name: str) -> int:
    """Getting the telescope id from the Telescopes table in the database
    :param telescope_name: the name of the telescope used in the observation week
    :return: The id of a telescope based on its name form the Dashboard database
    """
    result = pd.read_sql(
        """SELECT telescope_id FROM Telescopes where telescope_name= %s """,
        connection,
        params=(telescope_name,),
    )
    return result["telescope_id"][0]


def get_night_info_id(day: str) -> int:
    """Getting the night_info_id from the Night_Info table in the database
    :param day:  the date you want to get the id for
    :return: a date id as an int of the date from the Night_Info table in the Database named `Dashboard`
    """
    result = pd.read_sql(
        """SELECT night_info_id from Night_Info where start_date=%s """,
        connection,
        params=(day,),
    )

    return result["night_info_id"][0]


def end_of_week(year: int, month: int, day: int) -> bool:
    """Getting the end of the week from the spreadsheet so
    to get date on weekly basis for each telescope
    :param year: year in which the data was gathered and observations made
    :param month: month which observations fall under in a year
    :param day:the date in which an observation was taken in a year
    :return: True or false based on if the day in a year is Tuesday
    """
    return date(year, month, day).weekday() == 1


def get_telescope_usage_id(telescope_usage: str) -> int:
    """Getting the id of a telescope's usage based on what the usage was
    :param telescope_usage: the usage of a telescope that is not scientific but scheduled or unscheduled
    :return: the id of the usage the telescope had which was not scientific, such as Engineering
    time and Aluminising a mirror
    """
    result = pd.read_sql(
        """SELECT telescope_usage_id from Telescope_usage where telescope_usage=%s """,
        connection,
        params=(telescope_usage,),
    )
    return result["telescope_usage_id"][0]


def observation_details(telescope_name: str, filepath: str) -> Dict:
    """
    :param telescope_name: name of the telescope used by observer during the observations
    :param filepath: filepath to the spreadsheet to be entered ino the database
    :return: observer, instrument_id, telescope_id and telescope_usage_id for each observation week in
    the spreadsheet in the form of a dictionary
    """
    # instruments available on the spreadsheets, used for getting instrument id from the instruments table
    instruments = [
        "HIPPO",
        "SpUpNIC",
        "SHOC",
        "SIRIUS",
        "STE3",
        "STE4",
        "SIRPOL",
        "Own Instrument.",
    ]
    # array for all the usage of the telescope which can be categorised as Scheduled downtime or Engineering time
    usage_type = [
        "Aluminising",
        "Engineering",
        "Idle time",
    ]  # TODO find all usage types

    """reading the spreadsheet(s) on the specified filepath using
       pandas and specify which sheet in the spreadsheets is used for getting the date df_year
       is to get the year from the spreadsheet"""

    df = pd.read_excel(filepath, skiprows=1)
    df_year = pd.read_excel(filepath, "Sheet2")
    # variables used for storing the date we read from the spreadsheets
    observer = ""
    instrument = ""
    instrument_id = ""
    usage_type_id = ""
    temp_details = {}
    temp_days = []
    temp_all_data = []
    all_data = {}
    year = re.findall(r"[0-9]+", df_year.columns[2])

    # loop to loop through the spreadsheet(s) going through each row of the specified telescope name in the spreadsheet
    for index, row in df.iterrows():
        # checking for rows which are not empty or null in the spreadsheet(s)
        if not pd.isnull(row["Day"]):
            # parsing the date from the spreadsheet to a python date
            day = parser.parse(
                "{}-{}-{}".format(year[0], row["Month"], int(row["Date"]))
            ).strftime("%Y-%m-%d")

            """ condition to check for an observer from the spreadsheet(s) and resolve the rows in which an
                observer name and instrument are in the same row Ex: Erasmus(SHOC)
                row[telescope_name] is the row in each column of the spreadsheet containing the  telescope name passed
                as a parameter to the observation_details function """

            if (
                row[telescope_name] not in instruments
                and not pd.isnull(row[telescope_name])
                and row[telescope_name] not in usage_type
            ):
                if len(row[telescope_name].split()) > 1:

                    """ getting an instrument from a row in which an  observer name and instrument
                        are in the same row Ex: Erasmus(SHOC)"""

                    temp_inst = (
                        row[telescope_name].split()[1].replace("(", "").replace(")", "")
                    )
                    if temp_inst in instruments:

                        """adding/appending the processed date/ necessary date in the
                           dictionary returned by the function"""

                        all_data[day] = {
                            "observer": row[telescope_name].split()[0],
                            "instrument": temp_inst,
                            "usage": None,
                            "telescope": telescope_name,
                            "telescope_id": get_telescope_id(telescope_name),
                            "instrument_id": get_instrument_id(temp_inst),
                            "telescope_usage_id": usage_type_id,
                        }

                        """add the date to the observer variable if the condition above is not satisfied"""
                    else:
                        observer = row[telescope_name]
                        temp_days.append(day)

                        """checking for the end of the week and adding/ appending the date found
                           into a temporary variable(temp_details) so as to be able to reset the
                           variable when starting a new week"""

                    if end_of_week(
                        int(*year),
                        datetime.strptime(row["Month"], "%b").month,
                        int(row["Date"]),
                    ):
                        temp_details["days"] = temp_days
                        temp_details["observer"] = observer
                        temp_details["instrument"] = instrument
                        temp_details["usage"] = None
                        temp_details["instrument_id"] = instrument_id
                        temp_details["telescope_id"] = get_telescope_id(telescope_name)
                        temp_details["telescope_usage_id"] = usage_type_id
                        temp_days = []
                        temp_all_data.append(temp_details)
                        temp_details = {}

                        """resetting the variables to null/empty so as to get only date for one week"""
                        observer = ""
                        instrument = ""
                        instrument_id = ""
                        usage_type_id = ""
                    continue
                else:
                    observer = row[telescope_name]

                    """checking for instruments in the spreadsheet(s) and adding the result to the instrument variable
                    and getting the instrument id from the Instruments table using the instrument name"""
            if row[telescope_name] in instruments:
                instrument = row[telescope_name]
                instrument_id = get_instrument_id(instrument)

                """checking for telescope usage which can be described as scheduled downtime and adding
                   that information to the dictionary returned by the function or method observation_details
                """
            if row[telescope_name] in usage_type:
                usage = row[telescope_name]
                usage_type_id = get_telescope_usage_id(usage)
                all_data[day] = {
                    "observer": None,
                    "instrument": None,
                    "usage": row[telescope_name],
                    "telescope": telescope_name,
                    "telescope_id": get_telescope_id(telescope_name),
                    "instrument_id": None,
                    "telescope_usage_id": usage_type_id,
                }
                usage_type_id = ""
            else:
                temp_days.append(day)

                """appending the day in we found scheduled downtime to the temp_day variable"""

                """We the check for the end of the week and if end_of_week output is True, we add the date found
                   to the dictionary returned by the observation_details function/method"""
            if end_of_week(
                int(*year),
                datetime.strptime(row["Month"], "%b").month,
                int(row["Date"]),
            ):
                temp_details["days"] = temp_days
                temp_details["observer"] = observer
                temp_details["instrument"] = instrument
                temp_details["usage"] = None
                temp_details["instrument_id"] = instrument_id
                temp_details["telescope_id"] = get_telescope_id(telescope_name)
                temp_details["telescope_usage_id"] = usage_type_id
                temp_days = []

                """reset the variables again so as to contain values for the past week only"""
                observer = ""
                instrument = ""

                """add all the date in the variable temp_details to a new variable temp_all_data so as to
                   reset the temp_details at the end of a week"""
                temp_all_data.append(temp_details)
                temp_details = {}
                instrument_id = ""
                usage_type_id = ""

    for week in temp_all_data:
        """then week loop over each day of the week getting the date of interest"""
        for day in week["days"]:
            all_data[day] = {
                "observer": week["observer"],
                "instrument": week["instrument"],
                "usage": week["usage"],
                "instrument_id": week["instrument_id"],
                "telescope_id": week["telescope_id"],
                "telescope_usage_id": week["telescope_usage_id"],
            }

    return all_data


# Now we need to read the data and populate the database tables rota and Night_info


def insertion_of_dates_into_night_info(telescope_name: str, filepath: str):
    for dates in observation_details(telescope_name, filepath):
        start_date = dates
        try:
            mysql_insertion_statement = """INSERT INTO Night_Info(start_date)
                                       VALUES(%(observation_dates)s)on duplicate key update
                                       start_date = values(start_date) """
            cursor.execute(
                mysql_insertion_statement, dict(observation_dates=start_date)
            )
            connection.commit()

        except Exception as e:
            raise e
        connection.rollback()
    return None


def insertion_into_rota_table(telescope_name: str, filepath: str):
    for dates in observation_details(telescope_name, filepath):
        night_info_id = int(get_night_info_id(dates))
        telescope_id = int(
            observation_details(telescope_name, filepath)[dates]["telescope_id"]
        )
        instrument_id = observation_details(telescope_name, filepath)[dates][
            "instrument_id"
        ]
        observer = observation_details(telescope_name, filepath)[dates]["observer"]
        usage_type = observation_details(telescope_name, filepath)[dates]["usage"]

        if usage_type is None:
            usage_type_id = 3
        else:
            usage_type_id = int(get_telescope_usage_id(usage_type))

        if type(instrument_id) is not str and instrument_id is not None:
            instrument_id = int(instrument_id)
        else:
            instrument_id = None

        try:
            mysql_statement_rota_info = """INSERT INTO rota(
                                                            night_info_id,
                                                            telescope_id,
                                                            instrument_id,
                                                            observer,
                                                            telescope_usage_id)
                                           VALUES(%(night_info_date)s,
                                                 %(telescope_id)s,
                                                 %(instrument_id)s,
                                                 %(observer)s,
                                                 %(telescope_usage_id)s)
                            ON DUPLICATE KEY UPDATE night_info_id =values(night_info_id),
                            telescope_id=values(telescope_id), instrument_id = values(instrument_id),
                            observer= values(observer),telescope_usage_id = values(telescope_usage_id) """
            cursor.execute(
                mysql_statement_rota_info,
                dict(
                    night_info_date=int(night_info_id),
                    telescope_id=int(telescope_id),
                    instrument_id=instrument_id,
                    observer=observer,
                    telescope_usage_id=usage_type_id,
                ),
            )
            connection.commit()
        except Exception as e:
            raise e
        connection.rollback()
    return None


# populating the tables
def populating_database_tables(telescope_name: str, filepath: str) -> Dict:
    observation_details(telescope_name, filepath)
    insertion_of_dates_into_night_info(telescope_name, filepath)
    insertion_into_rota_table(telescope_name, filepath)
    return observation_details(telescope_name, filepath)
