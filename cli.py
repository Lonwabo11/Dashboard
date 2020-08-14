# importing the populating_database_tables()() function/method so as to be able to pass the filepath as a parameter
# to it
from database_population_using_spreadsheets import populating_database_tables
import click
import pprint
import os
import pymysql

database_host = os.environ.get("database_host")
database_user = os.environ.get("user")
database_password = os.environ.get("password")
database_name = os.environ.get("database")

connection = pymysql.connect(
    host=database_host, user=database_user, passwd=database_password, db=database_name
)
cursor = connection.cursor()


# using click to pass the filepath of the spreadsheet as a command line argument
@click.command()
@click.argument("filepath", type=click.Path(exists=True, readable=True), nargs=1)
def main(filepath):
    """ Change your working directory to the folder in which you cloned/ keep your
        cli.py file. On the command line, type the following:'python3 cli.py /filepath',
        where file path is the path to the spreadsheet you will use to populate the database"""
    if os.path.isfile(filepath):
        # call the function populating_database_tables so as to add the data from the spreadsheet in the filepath to
        # the database for all the populating_database_tables of concern
        pprint.PrettyPrinter(indent=4).pprint(
            populating_database_tables("1.9-m", filepath)
        )
        pprint.PrettyPrinter(indent=4).pprint(
            populating_database_tables("1.0-m", filepath)
        )
        pprint.PrettyPrinter(indent=4).pprint(
            populating_database_tables("IRSF", filepath)
        )
        pprint.PrettyPrinter(indent=4).pprint(
            populating_database_tables( "Lesedi", filepath)
        )
    print("data from", filepath, "has been added to the database")


main()
cursor.close()
