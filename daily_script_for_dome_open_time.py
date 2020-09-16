import datetime
import shutil
import os

from reading_shutter_open_time_logs import dome_shutter_open_time
from dome_shutter_open_time import inserting_shutter_open_time

date_today = datetime.datetime.now()
day_of_month = date_today.strftime("%d")

date_3_days_ago = date_today - datetime.timedelta(days=3)
date_2_days_ago = date_today - datetime.timedelta(days=2)
date_1_day_from_today = date_today - datetime.timedelta(days=1)

first_file_40_inch = ""
second_file_40_inch = ""
third_file_40_inch = ""

first_file_74_inch = ""
second_file_74_inch = ""
third_file_74_inch = ""

file_40_inch_1 = ""
file_40_inch_2 = ""

# getting the files
if date_today.month < 10:
    first_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(
        date_3_days_ago.year,
        date_3_days_ago.strftime("%d"),
        date_3_days_ago.strftime("%m"),
        abs(date_3_days_ago.year) % 100,
    )

    second_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(
        date_2_days_ago.year,
        date_2_days_ago.strftime("%d"),
        date_2_days_ago.strftime("%m"),
        abs(date_2_days_ago.year) % 100,
    )

    third_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(
        date_1_day_from_today.year,
        date_1_day_from_today.strftime("%d"),
        date_1_day_from_today.strftime("%m"),
        abs(date_1_day_from_today.year) % 100,
    )

    first_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(
        date_3_days_ago.year,
        date_3_days_ago.strftime("%d"),
        date_3_days_ago.strftime("%m"),
        abs(date_3_days_ago.year) % 100,
    )

    second_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(
        date_2_days_ago.year,
        date_2_days_ago.strftime("%d"),
        date_2_days_ago.strftime("%m"),
        abs(date_2_days_ago.year) % 100,
    )

    third_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(
        date_1_day_from_today.year,
        date_1_day_from_today.strftime("%d"),
        date_1_day_from_today.strftime("%m"),
        abs(date_1_day_from_today.year) % 100,
    )
else:

    first_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(
        date_3_days_ago.year,
        date_3_days_ago.strftime("%d"),
        date_today.month,
        abs(date_3_days_ago.year) % 100,
    )

    second_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(
        date_2_days_ago.year,
        date_2_days_ago.strftime("%d"),
        date_today.month,
        abs(date_2_days_ago.year) % 100,
    )

    third_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(
        date_1_day_from_today.year,
        date_1_day_from_today.strftime("%d"),
        date_today.month,
        abs(date_1_day_from_today.year) % 100,
    )

    first_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(
        date_3_days_ago.year,
        date_3_days_ago.strftime("%d"),
        date_today.month,
        abs(date_3_days_ago.year) % 100,
    )

    second_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(
        date_2_days_ago.year,
        date_2_days_ago.strftime("%d"),
        date_today.month,
        abs(date_2_days_ago.year) % 100,
    )

    third_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(
        date_1_day_from_today.year,
        date_1_day_from_today.strftime("%d"),
        date_today.month,
        abs(date_1_day_from_today.year) % 100,
    )


# copying the files
shutil.copy(first_file_40_inch, "/home/dashboard/Dashboard/Web_application/40_inch_new")
shutil.copy(
    second_file_40_inch, "/home/dashboard/Dashboard/Web_application/40_inch_new"
)
shutil.copy(third_file_40_inch, "/home/dashboard/Dashboard/Web_application/40_inch_new")

shutil.copy(first_file_74_inch, "/home/dashboard/Dashboard/Web_application/74_inch_new")
shutil.copy(
    second_file_74_inch, "/home/dashboard/Dashboard/Web_application/74_inch_new"
)
shutil.copy(third_file_74_inch, "/home/dashboard/Dashboard/Web_application/74_inch_new")

# now to read to read the files

dome_shutter_open_time(
    "/home/dashboard/Dashboard/Web_application/40_inch_new/", "1.0-m"
)
dome_shutter_open_time(
    "/home/dashboard/Dashboard/Web_application/74_inch_new/", "1.9-m"
)

# insert method for 40 inch files and 74 inch files

start_date = date_today.date() - datetime.timedelta(days=3)

end_date = date_today.date() - datetime.timedelta(days=1)

inserting_shutter_open_time(start_date, end_date, 1, 2)
inserting_shutter_open_time(start_date, end_date, 1, 3)

# now to clear the folders before next insert

# 40inch files
if date_today.month < 10:
    file_40_inch_1 = "/home/dashboard/Dashboard/Web_application/40_inch_new/{}{}{}.live".format(
        date_3_days_ago.strftime("%d"),
        date_3_days_ago.strftime("%m"),
        abs(date_3_days_ago.year) % 100,
    )

    file_40_inch_2 = "/home/dashboard/Dashboard/Web_application/40_inch_new/{}{}{}.live".format(
        date_2_days_ago.strftime("%d"),
        date_2_days_ago.strftime("%m"),
        abs(date_2_days_ago.year) % 100,
    )

    file_40_inch_3 = "/home/dashboard/Dashboard/Web_application/40_inch_new/{}{}{}.live".format(
        date_1_day_from_today.strftime("%d"),
        date_1_day_from_today.strftime("%m"),
        abs(date_1_day_from_today.year) % 100,
    )

    os.remove(file_40_inch_1)
    os.remove(file_40_inch_2)
    os.remove(file_40_inch_3)

else:

    file_40_inch_1 = "/home/dashboard/Dashboard/Web_application/40_inch_new/{}{}{}.live".format(
        date_3_days_ago.strftime("%d"),
        date_today.month,
        abs(date_3_days_ago.year) % 100,
    )

    file_40_inch_2 = "/home/dashboard/Dashboard/Web_application/40_inch_new/{}{}{}.live".format(
        date_2_days_ago.strftime("%d"),
        date_today.month,
        abs(date_2_days_ago.year) % 100,
    )

    file_40_inch_3 = "/home/dashboard/Dashboard/Web_application/40_inch_new/{}{}{}.live".format(
        date_1_day_from_today.strftime("%d"),
        date_today.month,
        abs(date_1_day_from_today.year) % 100,
    )

    os.remove(file_40_inch_1)
    os.remove(file_40_inch_2)
    os.remove(file_40_inch_3)

# 74inch files
if date_today.month < 10:

    filepath_74_inch_1 = "/home/dashboard/Dashboard/Web_application/74_inch_new/{}{}{}.live".format(
        date_3_days_ago.strftime("%d"),
        date_3_days_ago.strftime("%m"),
        abs(date_3_days_ago.year) % 100,
    )

    filepath_74_inch_2 = "/home/dashboard/Dashboard/Web_application/74_inch_new/{}{}{}.live".format(
        date_2_days_ago.strftime("%d"),
        date_2_days_ago.strftime("%m"),
        abs(date_2_days_ago.year) % 100,
    )

    filepath_74_inch_3 = "/home/dashboard/Dashboard/Web_application/74_inch_new/{}{}{}.live".format(
        date_1_day_from_today.strftime("%d"),
        date_1_day_from_today.strftime("%m"),
        abs(date_1_day_from_today.year) % 100,
    )

    os.remove(filepath_74_inch_1)
    os.remove(filepath_74_inch_2)
    os.remove(filepath_74_inch_3)

else:
    filepath_74_inch_1 = "/home/dashboard/Dashboard/Web_application/74_inch_new/{}{}{}.live".format(
        date_3_days_ago.strftime("%d"),
        date_today.month,
        abs(date_3_days_ago.year) % 100,
    )

    filepath_74_inch_2 = "/home/dashboard/Dashboard/Web_application/74_inch_new/{}{}{}.live".format(
        date_2_days_ago.strftime("%d"),
        date_today.month,
        abs(date_2_days_ago.year) % 100,
    )

    filepath_74_inch_3 = "/home/dashboard/Dashboard/Web_application/74_inch_new/{}{}{}.live".format(
        date_1_day_from_today.strftime("%d"),
        date_today.month,
        abs(date_1_day_from_today.year) % 100,
    )

    os.remove(filepath_74_inch_1)
    os.remove(filepath_74_inch_2)
    os.remove(filepath_74_inch_3)
