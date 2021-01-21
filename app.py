from flask import Flask, render_template, jsonify, request
import os
from flaskext.mysql import MySQL
import re
from operator import itemgetter
import datetime
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from typing import Tuple
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

sentry_sdk.init(
    dsn="https://f970d69b344b42dc882ea4e724eb2f61@sentry.io/1800443",
    integrations=[FlaskIntegration()],
)

app.config["MYSQL_DATABASE_HOST"] = os.getenv("MYSQL_DATABASE_HOST")
app.config["MYSQL_DATABASE_USER"] = os.getenv("MYSQL_DATABASE_USER")
app.config["MYSQL_DATABASE_PASSWORD"] = os.getenv("MYSQL_DATABASE_PASSWORD")
app.config["MYSQL_DATABASE_DB"] = os.getenv("MYSQL_DATABASE_DB")

mysql = MySQL(app)


@app.errorhandler(404)
def error_404(error):
    return render_template("404.html"), 404


@app.errorhandler(400)
def error_400(error):
    return render_template("400.html"), 400


@app.errorhandler(500)
def error_500(error):
    return render_template("500.html"), 500


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


def validate_telescope(telescope: str):
    telescope_names = ["1.0-m", "1.9-m", "IRSF", "Lesedi"]
    if telescope in telescope_names:
        return telescope
    else:
        raise ValueError("Incorrect telescope name given")


def get_telescope_id(telescope_name: str) -> int:
    database_connection = mysql.connect()
    with database_connection.cursor() as telescope_cursor:
        telescope_query = """select telescope_id from Telescopes where telescope_name=%(telescope_name)s"""
        telescope_cursor.execute(telescope_query, dict(telescope_name=telescope_name))
        results = telescope_cursor.fetchall()
        return results[0][0]


def validate_date(date_text: str):
    correct_date = re.match("\d{4}-\d{2}-\d{2}", date_text)
    if not correct_date:
        raise ValueError(
            "Incorrect date format, your date should be in the format of YYYY-MM-DD"
        )
    my_date = datetime.datetime.strptime(date_text, "%Y-%m-%d")

    if my_date.year < 2019:
        raise ValueError("Your starting year must be 2019 and further")


def query_dates(first_date: str, second_date: str) -> Tuple:
    validate_date(first_date)
    validate_date(second_date)
    return (
        datetime.datetime.strptime(str(first_date), "%Y-%m-%d").date(),
        datetime.datetime.strptime(str(second_date), "%Y-%m-%d").date(),
    )


def validate_trimester(trimester: int) -> int:
    if int(trimester) > 3 or int(trimester) < 1:
        raise ValueError(
            "trimester value must be less than 3 and not a negative number"
        )
    else:
        return trimester


def validate_quarter(quarter: int) -> int:
    if int(quarter) >= 1 or int(quarter) <= 4:
        return quarter
    else:
        raise ValueError(
            "Your value for a quarter must be greater than 1 and less than or equal to 4"
        )


@app.route("/Custom-period", methods=["GET"])
def custom_period():
    return render_template("custom_period.html")


def getting_api_information(
        request_param_start_date: str,
        request_param_end_date: str,
        request_param_telescope_name: str,
) -> Tuple:
    """ The start_date is inclusive in query but the last day is exclusive. It will
        give back the required information with one day missing. So if you need to
        include a day you want, make sure its one day after the one you need

      :param request_param_start_date: The date of the day you want the query to start, inclusive of the start date

      :param request_param_end_date: The date of the day you want to stop the query but its not inclusive

      :param request_param_telescope_name: The name of the telescope you make the query for

      :return: The results of your query"""

    database_connection = mysql.connect()
    with database_connection.cursor() as cursor:
        mysql_query = """ SELECT
                                start_date,
                                TimeLostToWeather,
                                Night_length,
                                observer,
                                instrument_name,
                                telescope_name,
                                telescope_usage,
                                shutter_open_time
        FROM rota
        LEFT OUTER JOIN Night_Info ON rota.night_info_id=Night_Info.night_info_id
        LEFT OUTER JOIN Instruments ON rota.instrument_id= Instruments.instrument_id
        LEFT OUTER JOIN Telescopes ON rota.telescope_id= Telescopes.telescope_id
        LEFT OUTER JOIN  Telescope_usage ON rota.telescope_usage_id= Telescope_usage.telescope_usage_id
        LEFT OUTER JOIN Shutter_open_time on Shutter_open_time.Night=Night_Info.start_date
        WHERE
        start_date >= %(starting_date)s
        AND start_date <%(ending_date)s
        AND telescope_name = %(telescope_name)s
        AND Shutter_open_time.telescope_id= %(telescope_id)s"""

        cursor.execute(
            mysql_query,
            dict(
                starting_date=request_param_start_date,
                ending_date=request_param_end_date,
                telescope_name=request_param_telescope_name,
                telescope_id=get_telescope_id(request_param_telescope_name),
            ),
        )
        results = cursor.fetchall()
        return results


def irsf_exception_to_dome(
        start_date: str, end_date: str, telescope_name: str
) -> Tuple:
    """We currently do not have access to the log files for the IRSF telescope so we have no way to know the dome
     shutter open time for it. This function makes its own database query so as to get the data to display for the API
     without using shutter open time"""
    database_connection = mysql.connect()
    with database_connection.cursor() as cursor:
        mysql_query = """SELECT
                                start_date,
                                TimeLostToWeather,
                                Night_length,
                                observer,
                                instrument_name,
                                telescope_name,
                                telescope_usage
        FROM rota
        LEFT OUTER JOIN Night_Info ON rota.night_info_id=Night_Info.night_info_id
        LEFT OUTER JOIN Instruments ON rota.instrument_id= Instruments.instrument_id
        LEFT OUTER JOIN Telescopes ON rota.telescope_id= Telescopes.telescope_id
        LEFT OUTER JOIN  Telescope_usage ON rota.telescope_usage_id= Telescope_usage.telescope_usage_id
        WHERE
        start_date >= %(starting_date)s
        AND start_date <%(ending_date)s
        AND telescope_name = %(telescope_name)s
        """

        cursor.execute(
            mysql_query,
            dict(
                starting_date=start_date,
                ending_date=end_date,
                telescope_name=telescope_name,
            ),
        )
    results = cursor.fetchall()
    return results


def lesedi_exception_to_dome(
        start_date: str, end_date: str, telescope_name: str
) -> Tuple:
    """We currently do not have a way to get the dome shutter open time for Lesedi.
     This function makes its own database query so as to get the data to display for the API
     without using shutter open time"""
    database_connection = mysql.connect()
    with database_connection.cursor() as cursor:
        mysql_query = """SELECT
                                start_date,
                                TimeLostToWeather,
                                Night_length,
                                observer,
                                instrument_name,
                                telescope_name,
                                telescope_usage
        FROM rota
        LEFT OUTER JOIN Night_Info ON rota.night_info_id=Night_Info.night_info_id
        LEFT OUTER JOIN Instruments ON rota.instrument_id= Instruments.instrument_id
        LEFT OUTER JOIN Telescopes ON rota.telescope_id= Telescopes.telescope_id
        LEFT OUTER JOIN  Telescope_usage ON rota.telescope_usage_id= Telescope_usage.telescope_usage_id
        WHERE
        start_date >= %(starting_date)s
        AND start_date <%(ending_date)s
        AND telescope_name = %(telescope_name)s
        """

        cursor.execute(
            mysql_query,
            dict(
                starting_date=start_date,
                ending_date=end_date,
                telescope_name=telescope_name,
            ),
        )
    results = cursor.fetchall()
    return results


@app.route("/night-info", methods=["GET"])
def night_info():
    """This is the end-point which shows the API we use to plot our graphs and
     stores all the data relevant for each telescope. It returns back a JSON object"""

    request_param_start_date = request.args["start_date"]
    request_param_end_date = request.args["end_date"]
    request_param_telescope_name = request.args["telescope"]

    telescope = validate_telescope(request_param_telescope_name)

    my_dates = query_dates(request_param_start_date, request_param_end_date)

    if my_dates[0] >= my_dates[1]:
        raise ValueError(
            "Your start date must be earlier than your end date and "
            "not equal to your end date"
        )

    results = getting_api_information(my_dates[0], my_dates[1], telescope)

    content = [
        {
            "night": (result[0]).isoformat(),
            "observer": result[3],
            "instrument": result[4],
            "telescope": result[5],
            "scheduled_downtime_category": result[6],
            "weather_downtime": result[1],
            "night_length": result[2],
            "dome_shutter_open_time": result[7],
        }
        for result in results
    ]
    content_irsf = [
        {
            "night": (result[0]).isoformat(),
            "observer": result[3],
            "instrument": result[4],
            "telescope": result[5],
            "scheduled_downtime_category": result[6],
            "weather_downtime": result[1],
            "night_length": result[2],
        }
        for result in irsf_exception_to_dome(my_dates[0], my_dates[1], telescope)
    ]
    content_lesedi = [
        {
            "night": (result[0]).isoformat(),
            "observer": result[3],
            "instrument": result[4],
            "telescope": result[5],
            "scheduled_downtime_category": result[6],
            "weather_downtime": result[1],
            "night_length": result[2],
        }
        for result in lesedi_exception_to_dome(my_dates[0], my_dates[1], telescope)
    ]

    irsf_data = list(map(itemgetter("telescope"), content_irsf))
    lesedi_data = list(map(itemgetter("telescope"), content_lesedi))

    if "IRSF" in irsf_data:
        return jsonify({"observation_details": content_irsf})

    if "Lesedi" in lesedi_data:
        return jsonify({"observation_details": content_lesedi})

    return jsonify({"observation_details": content})


def fetch_subscription_level_data(
        year: int, trimester: int, telescope_name: str
) -> Tuple:
    """This function gets the subscription level information for each telescope from the database"""
    database_connection = mysql.connect()

    with database_connection.cursor() as subscription_level_cursor:
        subscription_level_query = """SELECT * FROM subscription_level WHERE
                     year=%(year)s
                     AND trimester=%(trimester)s
                     AND telescope_name=%(telescope_name)s"""
        subscription_level_cursor.execute(
            subscription_level_query,
            dict(year=year, trimester=trimester, telescope_name=telescope_name),
        )
        database_results = subscription_level_cursor.fetchall()
        return database_results


@app.route("/subscription_level", methods=["GET"])
def subscription_level():
    """This endpoint displays the API for the subscription level information for each telescope.
    This is where we get the information to draw the graphs for subscription levels both on the
    Dashboard endpoint and the custom period endpoint"""

    request_param_year = request.args["year"]
    request_param_trimester = request.args["trimester"]
    request_param_telescope = request.args["telescope"]
    validate_trimester(request_param_trimester)
    validate_telescope(request_param_telescope)

    database_results = fetch_subscription_level_data(
        request_param_year, request_param_trimester, request_param_telescope
    )

    content = [
        {
            "year": int(result[4]),
            "trimester": result[1],
            "telescope_name": result[2],
            "subscription": result[3],
        }
        for result in database_results
    ]

    return jsonify({"subscription_level": content})


@app.route("/Dashboard", methods=["GET"])
def dashboard():
    """This is the Dashboard endpoint. We show the plots for the
    Previous trimester, last 30 days and  the last seven days """
    return render_template("Dashboard.html")


@app.route("/publications/<telescope_name>")
def publications(telescope_name: str):
    """This is the publications endpoint. We show the publications
    of each of the telescopes(1.0-m, 1.9-m, IRSF)"""
    if telescope_name == "1.0-m":
        return render_template("1.0-m_publications.html")
    if telescope_name == "1.9-m":
        return render_template("1.9-m_publications.html")
    if telescope_name == "IRSF":
        return render_template("IRSF_publications.html")
    if telescope_name == "Lesedi":
        return render_template("Lesedi_publications.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0")
