# importing the populating_database_tables()() function/method so as to be able to pass the filepath as a parameter
# to it
from database_population_using_spreadsheets import populating_database_tables
import click
import pprint
import os
from dotenv import load_dotenv
from app import mysql

load_dotenv()

connection = mysql.connect()
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

        try:
            pprint.PrettyPrinter(indent=4).pprint(
                populating_database_tables("1.9-m", filepath))
            pprint.PrettyPrinter(indent=4).pprint(
                populating_database_tables("1.0-m", filepath)
            )
            pprint.PrettyPrinter(indent=4).pprint(
                populating_database_tables("IRSF", filepath)
            )
            pprint.PrettyPrinter(indent=4).pprint(
                populating_database_tables("Lesedi", filepath)
            )
        except KeyError as error:
            print("{}. Please check that your excel file has a column for each of the telescopes".format(error))

    print("data from", filepath, "has been added to the database")


main()
cursor.close()
