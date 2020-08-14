import os
from datetime import datetime
import datetime
from typing import Dict, Tuple
import MySQLdb

database_host = os.environ.get("database_host")
database_user = os.environ.get("user")
database_password = os.environ.get("password")
database_name = os.environ.get("database")

connection = MySQLdb.connect(
    host=database_host, user=database_user, passwd=database_password, db=database_name
)


def getting_shutter_open_time_info(
    start_date: datetime.date,
    end_date: datetime.date,
    dome_status_id: int,
    telescope_id: int,
) -> Tuple:
    """This function retrieves information from the dome_shutter_open_time table in the Dashboard database.
     The start date and end date give you a time range, with the start date inclusive and the end date exclusive
     from the query, meaning it doesn't include the final day.
    :param start_date: the starting date(inclusive) for your query
    :param end_date: the ending date(exclusive) for your query
    :param dome_status_id: The dome status id tells us if the dome is open or closed, with 1 representing OPEN and
    2 representing CLOSED
    :param telescope_id: The id of each of the steerable telescopes to identify it based on its name
    :return: A tuple of the results from the database query
    """
    start_time = start_date.strftime("%Y-%m-%d") + " 12:00"
    end_time = end_date.strftime("%Y-%m-%d") + " 12:00"

    with connection.cursor(MySQLdb.cursors.DictCursor) as shutter_open_time_cursor:
        mysql_statement = """SELECT 
                                converted_julian_date,
                                telescope_id,
                                dome_status_id 
                        FROM dome_shutter_open_time
                        WHERE converted_julian_date >= %(start_date)s
                        and converted_julian_date < %(end_date)s
                        and dome_status_id= %(dome_status_id)s
                        and telescope_id=%(telescope_id)s"""

        shutter_open_time_cursor.execute(
            mysql_statement,
            dict(
                start_date=start_time,
                end_date=end_time,
                dome_status_id=dome_status_id,
                telescope_id=telescope_id,
            ),
        )
        results = shutter_open_time_cursor.fetchall()
        return results


def shutter_open_time(
    start_date: datetime.date,
    end_date: datetime.date,
    dome_status_id: int,
    telescope_id: int,
) -> Dict:
    final_dict = {}
    final_dome_status = {}

    total = 0

    shutter_open_time_database_results = getting_shutter_open_time_info(
        start_date, end_date, dome_status_id, telescope_id
    )

    for shutter_result in shutter_open_time_database_results:
        current_date = shutter_result["converted_julian_date"].date()

        if shutter_result["converted_julian_date"].time() < datetime.time(12, 0):
            current_date = current_date - datetime.timedelta(days=1)

        if current_date not in final_dict:
            final_dict[current_date] = []

        final_dict[current_date].append(shutter_result["converted_julian_date"])

    for key, value in final_dict.items():
        for times in range(0, len(value) - 1):
            time_difference = value[times + 1] - value[times]
            if time_difference <= datetime.timedelta(seconds=7):
                total += time_difference.total_seconds()
        final_dome_status[key] = total
        total = 0

    t = start_date
    while t < end_date:
        if t not in final_dome_status:
            final_dome_status[t] = 0
        t += datetime.timedelta(days=1)

    return final_dome_status


def inserting_shutter_open_time(
    start_date: datetime.date,
    end_date: datetime.date,
    dome_status_id: int,
    telescope_id: int,
):
    for dates, times in shutter_open_time(
        start_date, end_date, dome_status_id, telescope_id
    ).items():
        night_info_date = dates

        with connection.cursor() as shutter_open_time_cursor:
            try:
                mysql_statement = """INSERT INTO Shutter_open_time(
                                                              Night,
                                                              telescope_id,
                                                              shutter_open_time)
                                                              VALUES (
                                                              %(night_info)s,
                                                              %(telescope_id)s,
                                                              %(shutter_open_time)s)
                                ON DUPLICATE KEY UPDATE
                                                       Night=values(Night),
                                                       telescope_id=values(telescope_id),
                                                       shutter_open_time=values(shutter_open_time)"""

                shutter_open_time_cursor.execute(
                    mysql_statement,
                    dict(
                        night_info=night_info_date,
                        telescope_id=telescope_id,
                        shutter_open_time=times,
                    ),
                )
                connection.commit()
            except KeyError:
                connection.rollback()
