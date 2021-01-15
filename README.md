SALT/SAAO Dashboard For Steerable Telescope
---
Introduction
---
The SALT/SAAO dashboard for steerable telescopes is used for comparison of work efficiency 
and to show the publications made by each of the following telescopes.
* Lesedi
* IRSF
* 1.0 meter
* 1.9 meter

## Setting up

Ensure that [Python](https://www.python.org/) version 3.7, [Pandas](https://pandas.pydata.org/pandas-docs/stable/install.html) and
[MySQL server](https://dev.mysql.com/downloads/mysql/) are installed in your machine.

To check your installed python version, you can run the following command
```bash
python3 --version
```
If it is not installed on your machine already, install pipenv. One option for this is to use pip,
```bash
pip3 install pipenv
```

Then clone this repository to a location of your choice
````bash
git clone https://github.com/Lonwabo11/Dashboard.git
````
Also make sure you are on the master branch,
```bash
git checkout master
```

To install the required packages for this project run the following command:

```bash
cd Dashboard
```
Then activate the virtual environment: 
```bash
source venv/bin/activate 
```
Then before running the project, we need to define the environment variables

| Variable name | Explanation   | Example|
| ------------- |:-------------:| -----:|
| MYSQL_USER    | Username for the SALT/SAAO database | root|
| MYSQL_PASSWORD| The password the SALT/SAAO database |  1234 |
| MYSQL_DB       | The name for your SALT/SAAO database  |  SALT_dashboard |
| MYSQL_HOST     | Host of the SALT/SAAO Dashboard database| localhost|
| sdb_host| Host of the live SDB database| 123.80.12.64
| sdb_user| The username for the SDB database|SDBUSER  
| sdb_password| The password for the SDB database| 56978
|sdb_database| The name of the database hosted at sdb_host| SALT_SDB
|database_host| The name of the SALT/SAAO database| localhost
 
See below how to run the script

## Running the script
To install a MySQL server on Ubuntu/Linux, run the following commands:
```bash
sudo apt-get update
sudo apt-get install mysql-server
```
or follow this link to for installation [Mysql community ](https://dev.mysql.com/downloads/mysql/)

The  database_population_using_spreadsheets.py file contains the code to read the spreadsheet(s) and insert into the database.

Then we run the file spreadsheet_dates.py, which will add all the dates on the spreadsheet to the Night_Info table
```bash
python spreadsheet_dates filepath
```
Then we run the script(database_population_using_spreadsheets.py file), we must pass the file path to the spreadsheet to
be read via a command line argument. 

```bash
python cli.py filepath
```
'filepath' will be replaced by the file path in which you saved the spreadsheet(s) and cli.py 
is the name of the python file containing the code to pass the file path to the spreadsheet  as a command line argument.

The files sdb_access_update_night_info, length_of_observation_night and daily_script_for_dome_open_time have to be
placed in a cronjob as these files must execute every day. sdb_access_update_night_info.py and
length_of_observation_night.py can be run at 08:30 AM SAST and daily_script_for_dome_open_time.py must be run at 
12:45 PM SAST when the logs of the telescopes(1.0-m and 1.9-m) are available on the server. 