import click
import pprint
import pandas as pd
import re
from dateutil import parser
import os
import MySQLdb
from dotenv import load_dotenv

load_dotenv()


def all_dates(filepath):
    df = pd.read_excel(filepath, skiprows=1, engine='openpyxl')
    df_year = pd.read_excel(filepath, "Sheet2", engine="openpyxl")
    year = re.findall(r"[0-9]+", df_year.columns[2])
    all_days = []
    for index, row in df.iterrows():
        # checking for rows which are not empty or null in the spreadsheet(s)
        if not pd.isnull(row["Day"]):
            # parsing the date from the spreadsheet to a python date
            day = parser.parse(
                "{}-{}-{}".format(year[0], row["Month"], int(row["Date"]))
            ).strftime("%Y-%m-%d")
            all_days.append(day)
    return all_days


database_host = os.getenv("MYSQL_DATABASE_HOST")
database_user = os.getenv("MYSQL_DATABASE_USER")
database_password = os.getenv("MYSQL_DATABASE_PASSWORD")
database_name = os.getenv("MYSQL_DATABASE_DB")


connection = MySQLdb.connect(
    host=database_host,
    user=database_user,
    port=3306,
    password=database_password,
    db=database_name,
)


def inserting_dates(filepath):
    for dates in all_dates(filepath):
        mysql = """insert into Night_Info(start_date) values(%(spread_sheet_dates)s)
                   on duplicate key update start_date = values(start_date)"""
        with connection.cursor() as date_cursor:
            date_cursor.execute(mysql, dict(spread_sheet_dates=dates))
            connection.commit()
    return "Successfully inserted"


@click.command()
@click.argument("filepath", type=click.Path(exists=True, readable=True), nargs=1)
def main(filepath):
    """Give the filepath to the spreadsheet in order to add the dates"""
    if os.path.isfile(filepath):
        # call the function populating_database_tables so as to add the data from the spreadsheet in the filepath to
        # the database for all the populating_database_tables of concern
        pprint.PrettyPrinter(indent=4).pprint(
            inserting_dates(filepath)
        )


main()
