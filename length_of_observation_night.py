import os
import mysql.connector
from typing import List
from dotenv import load_dotenv

load_dotenv()

database_host = os.getenv("MYSQL_DATABASE_HOST")
database_user = os.getenv("MYSQL_DATABASE_USER")
database_password = os.getenv("MYSQL_DATABASE_PASSWORD")
database_name = os.getenv("MYSQL_DATABASE_DB")

sdb_host = os.getenv("SDB_HOST")
sdb_database_user = os.getenv("SDB_DATABASE_USER")
sdb_database_password = os.getenv("SDB_DATABASE_PASSWORD")
sdb_database_name = os.getenv("SDB_DATABASE_NAME")

sdb_connection = mysql.connector.connect(
    host=sdb_host,
    user=sdb_database_user,
    password=sdb_database_password,
    database=sdb_database_name,
)

dashboard_connection = mysql.connector.connect(
    host=database_host,
    user=database_user,
    password=database_password,
    database=database_name,
)


def getting_twilight_times(start_date: str) -> List:
    mysql_statement = """SELECT
                               Date,
                               EveningTwilightEnd,
                               MorningTwilightStart FROM sdb.NightInfo
                               WHERE Date =%(date)s"""
    cursor = sdb_connection.cursor(dictionary=True)
    cursor.execute(mysql_statement, dict(date=start_date))
    results = cursor.fetchall()
    cursor.close()
    sdb_connection.close()
    return results


def length_of_each_night(start_date: str):
    night_length_array = []
    for result in getting_twilight_times(start_date):
        my_dict = {
            result["Date"]: result["MorningTwilightStart"]
            - result["EveningTwilightEnd"]
        }
        night_length_array.append(my_dict)

    return night_length_array


def add_night_length_to_night_info(date):
    for length in length_of_each_night(date):
        for key, value in length.items():
            mysql_statement = """ UPDATE Night_Info
                             SET Night_length=%(length_of_night)s
                             WHERE start_date=%(observation_date)s"""
            dashboard_connection.autocommit = False
            cursor = dashboard_connection.cursor()
            cursor.execute(
                mysql_statement,
                dict(length_of_night=value.total_seconds(), observation_date=key),
            )
            dashboard_connection.commit()
            cursor.close()
            dashboard_connection.close()

    return "Data has been added to database"
