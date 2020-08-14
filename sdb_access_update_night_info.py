import mysql.connector
import os
import datetime
from typing import List

"""environment variables for the Dashboard database and sbd database"""
sdb_host = os.environ.get("sdb_host")
sdb_database_user = os.environ.get("sdb_database_user")
sdb_database_password = os.environ.get("sdb_database_password")
sdb_database_name = os.environ.get("sdb_database_name")

dashboard_database_host = os.environ.get("database_host")
dashboard_database_user = os.environ.get("user")
dashboard_database_password = os.environ.get("password")
dashboard_database_name = os.environ.get("database")

sdb_connection = mysql.connector.connect(
    host=sdb_host,
    user=sdb_database_user,
    passwd=sdb_database_password,
    database=sdb_database_name,
)

connection = mysql.connector.connect(
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
    mysql_query = """SELECT
                           EveningTwilightEnd,
                           MorningTwilightStart,
                           TimeLostToWeather,
                           Date
                     FROM sdb.NightInfo
                     WHERE Date = %(start_date)s"""

    cursor = sdb_connection.cursor(dictionary=True)
    cursor.execute(mysql_query, dict(start_date=observation_night_date))
    results = cursor.fetchall()
    cursor.close()
    sdb_connection.close()
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

        mysql_update_query = """UPDATE Night_Info
                                                SET EveningTwilightEnd = %(observation_starting_time)s,
                                                    MorningTwilightStart = %(observation_ending_time)s,
                                                    TimeLostToWeather = %(time_lost_to_weather)s
                            WHERE start_date = %(observation_date)s """
        cursor = connection.cursor()
        cursor.execute(
            mysql_update_query,
            dict(
                observation_starting_time=evening_twilight_end,
                observation_ending_time=morning_twilight_start,
                time_lost_to_weather=time_lost_to_weather,
                observation_date=date,
            ),
        )
        connection.commit()
        connection.close()
        cursor.close()

    return "Night_Info has been updated"
