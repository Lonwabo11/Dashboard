import MySQLdb
import os
import datetime
from typing import List
from dotenv import load_dotenv

load_dotenv()

"""environment variables for the Dashboard database and sdb database"""
sdb_host = os.getenv("SDB_HOST")
sdb_database_user = os.getenv("SDB_DATABASE_USER")
sdb_database_password = os.getenv("SDB_DATABASE_PASSWORD")
sdb_database_name = os.getenv("SDB_DATABASE_NAME")

dashboard_database_host = os.getenv("MYSQL_DATABASE_HOST")
dashboard_database_user = os.getenv("MYSQL_DATABASE_USER")
dashboard_database_password = os.getenv("MYSQL_DATABASE_PASSWORD")
dashboard_database_name = os.getenv("MYSQL_DATABASE_DB")

sdb_connection = MySQLdb.connect(
    host=sdb_host,
    user=sdb_database_user,
    passwd=sdb_database_password,
    database=sdb_database_name,
)

connection = MySQLdb.connect(
    host=dashboard_database_host,
    user=dashboard_database_user,
    passwd=dashboard_database_password,
    database=dashboard_database_name,
)


def get_twilight_and_weather_from_sdb(observation_night_date: datetime.date) -> List:
    """
    This function connects to the sdb database and reads the start and end of twilight times
    as well time lost to weather for a single observation day
    :param observation_night_date: The day of the observation(the date)
    :return: returns the results of the query below
    """
    with sdb_connection.cursor(dictionary=True) as sdb_cursor:
        mysql_query = """SELECT
                           EveningTwilightEnd,
                           MorningTwilightStart,
                           TimeLostToWeather,
                           Date
                     FROM sdb.NightInfo
                     WHERE Date = %(start_date)s"""

        sdb_cursor.execute(mysql_query, dict(start_date=observation_night_date))
        results = sdb_cursor.fetchall()
        return results


def update_night_info(observing_night: datetime.date) -> str:
    """This function updates the night info table in the dashboard database, adding
    the start and end time of twilight as well as time lost to weather for each
    observing night
    :param observing_night: The date(night before) when observation was made
    :return: logs on to a file whether it was successful or not
    """
    for result in get_twilight_and_weather_from_sdb(observing_night):
        evening_twilight_end = result["EveningTwilightEnd"]
        morning_twilight_start = result["MorningTwilightStart"]
        time_lost_to_weather = result["TimeLostToWeather"]
        date = result["Date"]

        with connection.cursor() as sdb_cursor:
            mysql_update_query = """UPDATE Night_Info
                                                SET EveningTwilightEnd = %(observation_starting_time)s,
                                                    MorningTwilightStart = %(observation_ending_time)s,
                                                    TimeLostToWeather = %(time_lost_to_weather)s
                                     WHERE start_date = %(observation_date)s """

            sdb_cursor.execute(
                mysql_update_query,
                dict(
                    observation_starting_time=evening_twilight_end,
                    observation_ending_time=morning_twilight_start,
                    time_lost_to_weather=time_lost_to_weather,
                    observation_date=date
                ),
            )
            connection.commit()

    return "Night_Info has been updated"
