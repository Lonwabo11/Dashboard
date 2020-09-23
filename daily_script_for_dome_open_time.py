import datetime
import shutil
import os

from reading_shutter_open_time_logs import dome_shutter_open_time
from dome_shutter_open_time import inserting_shutter_open_time

date_today = datetime.datetime.now()

date_3_days_ago = date_today - datetime.timedelta(days=3)
date_2_days_ago = date_today - datetime.timedelta(days=2)
date_yesterday = date_today - datetime.timedelta(days=1)

# getting the files
if date_today.month < 10:

    # The four files for the 1.0-m telescope

    first_log_file_40_inch = '/data/tcs/40in/{}/{}{}{}.live'.format(date_3_days_ago.year,
                                                                    date_3_days_ago.strftime("%d"),
                                                                    date_3_days_ago.strftime("%m"),
                                                                    abs(date_3_days_ago.year) % 100)

    second_log_file_40_inch = '/data/tcs/40in/{}/{}{}{}.live'.format(date_2_days_ago.year,
                                                                     date_2_days_ago.strftime("%d"),
                                                                     date_2_days_ago.strftime("%m"),
                                                                     abs(date_2_days_ago.year) % 100)

    third_log_file_40_inch = '/data/tcs/40in/{}/{}{}{}.live'.format(date_yesterday.year,
                                                                    date_yesterday.strftime("%d"),
                                                                    date_yesterday.strftime("%m"),
                                                                    abs(date_yesterday.year) % 100)

    fourth_log_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(date_today.year,
                                                                     date_today.strftime("%d"),
                                                                     date_today.strftime("%m"),
                                                                     abs(date_today.year) % 100)

    # the 4 files for the 74 inch telescope

    first_log_file_74_inch = '/data/tcs/74in/{}/{}{}{}.live'.format(date_3_days_ago.year,
                                                                    date_3_days_ago.strftime("%d"),
                                                                    date_3_days_ago.strftime("%m"),
                                                                    abs(date_3_days_ago.year) % 100)

    second_log_file_74_inch = '/data/tcs/74in/{}/{}{}{}.live'.format(date_2_days_ago.year,
                                                                     date_2_days_ago.strftime("%d"),
                                                                     date_2_days_ago.strftime("%m"),
                                                                     abs(date_2_days_ago.year) % 100)

    third_log_file_74_inch = '/data/tcs/74in/{}/{}{}{}.live'.format(date_yesterday.year,
                                                                    date_yesterday.strftime("%d"),
                                                                    date_yesterday.strftime("%m"),
                                                                    abs(date_yesterday.year) % 100)

    fourth_log_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(date_today.year,
                                                                     date_today.strftime("%d"),
                                                                     date_today.strftime("%m"),
                                                                     abs(date_today.year) % 100)

else:

    # files for 40 inch telescope when month is Oct-Dec
    first_log_file_40_inch = '/data/tcs/40in/{}/{}{}{}.live'.format(date_3_days_ago.year,
                                                                    date_3_days_ago.strftime("%d"),
                                                                    date_today.month,
                                                                    abs(date_3_days_ago.year) % 100)

    second_log_file_40_inch = '/data/tcs/40in/{}/{}{}{}.live'.format(date_2_days_ago.year,
                                                                     date_2_days_ago.strftime("%d"),
                                                                     date_today.month,
                                                                     abs(date_2_days_ago.year) % 100)

    third_log_file_40_inch = '/data/tcs/40in/{}/{}{}{}.live'.format(date_yesterday.year,
                                                                    date_yesterday.strftime("%d"),
                                                                    date_today.month,
                                                                    abs(date_yesterday.year) % 100)

    fourth_log_file_40_inch = "/data/tcs/40in/{}/{}{}{}.live".format(date_today.year,
                                                                     date_today.strftime("%d"),
                                                                     date_today.month,
                                                                     abs(date_today.year) % 100)
    # 74 inch files when month Oct-Dec

    first_log_file_74_inch = '/data/tcs/74in/{}/{}{}{}.live'.format(date_3_days_ago.year,
                                                                    date_3_days_ago.strftime("%d"),
                                                                    date_today.month,
                                                                    abs(date_3_days_ago.year) % 100)

    second_log_file_74_inch = '/data/tcs/74in/{}/{}{}{}.live'.format(date_2_days_ago.year,
                                                                     date_2_days_ago.strftime("%d"),
                                                                     date_today.month,
                                                                     abs(date_2_days_ago.year) % 100)

    third_log_file_74_inch = '/data/tcs/74in/{}/{}{}{}.live'.format(date_yesterday.year,
                                                                    date_yesterday.strftime("%d"),
                                                                    date_today.month,
                                                                    abs(date_yesterday.year) % 100)

    fourth_log_file_74_inch = "/data/tcs/74in/{}/{}{}{}.live".format(date_today.year,
                                                                     date_today.strftime("%d"),
                                                                     date_today.strftime("%m"),
                                                                     abs(date_today.year) % 100)
# copying the files
try:
    shutil.copy(first_log_file_40_inch, '/home/dashboard/Dashboard/Web_application/40_inch_new')
    shutil.copy(second_log_file_40_inch, '/home/dashboard/Dashboard/Web_application/40_inch_new')
    shutil.copy(third_log_file_40_inch, '/home/dashboard/Dashboard/Web_application/40_inch_new')
    shutil.copy(fourth_log_file_40_inch, '/home/dashboard/Dashboard/Web_application/40_inch_new')

    shutil.copy(first_log_file_74_inch, '/home/dashboard/Dashboard/Web_application/74_inch_new')
    shutil.copy(second_log_file_74_inch, '/home/dashboard/Dashboard/Web_application/74_inch_new')
    shutil.copy(third_log_file_74_inch, '/home/dashboard/Dashboard/Web_application/74_inch_new')
    shutil.copy(fourth_log_file_74_inch, '/home/dashboard/Dashboard/Web_application/74_inch_new')

except FileNotFoundError as e:
    print(e)

# now to read to read the files

dome_shutter_open_time('/home/dashboard/Dashboard/Web_application/40_inch_new/', '1.0-m')
dome_shutter_open_time('/home/dashboard/Dashboard/Web_application/74_inch_new/', '1.9-m')

# inserting into the Shutter open time table for 40inch and 74inch telescopes

start_date = date_today.date() - datetime.timedelta(days=3)

end_date = date_today.date() - datetime.timedelta(days=1)

inserting_shutter_open_time(start_date, end_date, 1, 2)
inserting_shutter_open_time(start_date, end_date, 1, 3)

# now to clear the folders before next insert


def clear_folders_for_log_files(folder):

    if date_today.month < 10:
        # when month is Jan-Sep
        filepath1 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_3_days_ago.strftime("%d"),
            date_3_days_ago.strftime("%m"),
            abs(date_3_days_ago.year) % 100)

        filepath2 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_2_days_ago.strftime("%d"),
            date_2_days_ago.strftime("%m"),
            abs(date_2_days_ago.year) % 100)

        filepath3 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_yesterday.strftime("%d"),
            date_yesterday.strftime("%m"),
            abs(date_yesterday.year) % 100)

        filepath4 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_today.strftime("%d"),
            date_today.strftime("%m"),
            abs(date_today.year) % 100)

        os.remove(filepath1)
        os.remove(filepath2)
        os.remove(filepath3)
        os.remove(filepath4)

    else:
        # when month is Oct-Dec
        filepath1 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_3_days_ago.strftime("%d"),
            date_today.month,
            abs(date_3_days_ago.year) % 100)

        filepath2 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_2_days_ago.strftime("%d"),
            date_today.month,
            abs(date_2_days_ago.year) % 100)

        filepath3 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_yesterday.strftime("%d"),
            date_today.month,
            abs(date_yesterday.year) % 100)

        filepath4 = '/home/dashboard/Dashboard/Web_application/{}/{}{}{}.live'.format(
            folder,
            date_today.strftime("%d"),
            date_today.month,
            abs(date_yesterday.year) % 100)

        os.remove(filepath1)
        os.remove(filepath2)
        os.remove(filepath3)
        os.remove(filepath4)
    return None


clear_folders_for_log_files("40_inch_new")
clear_folders_for_log_files("74_inch_new")
