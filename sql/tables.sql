/** rota table to store the  rota information from the spreadsheet, this table will be populated by the Reading_and_inserting.py file*/

CREATE DATABASE IF NOT EXISTS `Dashboard`;

USE Dashboard;

DROP TABLE IF EXISTS `rota`;

/** the night_info_id is from the Night_Info table for each date allocated for observation*/
/** the telescope_id is from the Telescopes table for each telescope*/
/** the instrument_id is from the Instruments table for each instrument*/
/** `observer` is name of the observer per week and per telescope*/
/** the telescope_usage_id from the telescope_usage table for each telescope*/

CREATE TABLE rota
(
    night_info_id   INT(11) NOT NULL,
    telescope_id    INT(11) NOT NULL,
    instrument_id   INT(11),
    observer        VARCHAR(40),
    telescope_usage_id INT(11),
    INDEX(observer),
    PRIMARY KEY (night_info_id, telescope_id),
    FOREIGN KEY (instrument_id) REFERENCES Instruments(instrument_id),
    FOREIGN KEY (telescope_id)  REFERENCES Telescopes(telescope_id),
    FOREIGN KEY (night_info_id) REFERENCES Night_Info(night_info_id),
    FOREIGN KEY (telescope_usage_id) REFERENCES Telescope_usage(telescope_usage_id)
);

/** Night info table to store the dates from the spreadsheet */

DROP TABLE IF EXISTS `Night_Info`;

/** night_info_id is auto incremented so as to have a primary key in the Night_Info table*/
/** start_date is the date of the start of the night an observer is observing*/

CREATE TABLE Night_Info
(
    night_info_id INT(11) auto_increment PRIMARY KEY NOT NULL,
    start_date    DATE UNIQUE NOT NULL,
    TimeLostToWeather int(11),
    EveningTwilightEnd datetime,
    MorningTwilightStart datetime,
    Night_length int(11)
);

DROP TABLE IF EXISTS `Instruments`;

/** instrument_id is so as to make sure every instrument is unique*/
/** instrument_name is the name for each instrument*/

CREATE TABLE Instruments
(
    instrument_id   INT(11) auto_increment PRIMARY KEY NOT NULL,
    instrument_name VARCHAR(40) UNIQUE
);

DROP  TABLE IF EXISTS `Telescope_usage`;

/** telescope_usage_id is so as to make sure every usage of a telescope recorded is unique*/
/** telescope_usage is regarded as the scheduled down time for each telescope*/

CREATE TABLE Telescope_usage
(
    telescope_usage_id INT(11) auto_increment PRIMARY KEY NOT NULL,
    telescope_usage    VARCHAR(40)
);

/**insert statement for the Telescope_usage table*/
INSERT INTO Telescope_usage(telescope_usage)
VALUES ('Engineering'), ('Aluminising'), ('None');

/**insert statement for the Instruments table*/

INSERT INTO Instruments
(instrument_name)
VALUES     ( 'HIPPO'),( 'SpUpNIC'),( 'SHOC'), ('SIRIUS'),('STE3'),('STE4'),
           ('SIRPOL'),('Own Instrument.');


/**creating the table for telescope names*/

DROP TABLE IF EXISTS `Telescopes`;

/** telescope_name so each telescope is unique*/

CREATE TABLE Telescopes
(
    telescope_id INT(11) AUTO_INCREMENT PRIMARY KEY NOT NULL,
    telescope_name VARCHAR(40) UNIQUE
);

/** insert statement for Telescopes table*/

INSERT INTO Telescopes
(telescope_name)
VALUES     ( 'Lesedi'),
           ( '1.0-m'),
           ('1.9-m'),
           ('IRSF');


/** creating a look up table for the dome status id*/

DROP TABLE IF EXISTS `dome_status`;

CREATE TABLE dome_status(

                            id int(11) PRIMARY KEY AUTO_INCREMENT,
                            status VARCHAR(30)

);

/** insert statement for dome_status table*/

INSERT INTO dome_status
(status)
VALUES     ( 'OPEN'),
           ( 'CLOSED'),
           ('UNKNOWN');


/** creating a table to store log file information about shutter open time*/

DROP TABLE IF EXISTS `dome_shutter_open_time`;

/** The julian date is the datetime so we can get which day we are in*/
/** The converted_julian_date is the julian date in human readable format (ISO format) */
/** telescope_id is the the id of each steerable telescope*/
/** dome_status_id is the id of the dome to tell if telescope dome is open or closed */
/** dome_status tells us if the dome is open or closed */

create table dome_shutter_open_time(
                                       julian_date decimal(12,5),
                                       converted_julian_date datetime,
                                       telescope_id int(10),
                                       dome_status_id int(10),
                                       primary key(julian_date, telescope_id),
                                       foreign key(telescope_id) references Telescopes(telescope_id),
                                       foreign key(dome_status_id) references dome_status(id),
                                       index search_params(converted_julian_date, telescope_id)
);

/** creating a table to store the details of dome_shutter_open_time*/

DROP TABLE IF EXISTS `Shutter_open_time`;

/** Night is the date of the observation*/
/** telescope_id is id representing each of the telescopes*/
/** Shutter open time is how long the telescope shutter was open in that observation day*/

CREATE TABLE Shutter_open_time(
                                  Night DATE,
                                  telescope_id INT(11),
                                  shutter_open_time INT(11),
                                  FOREIGN KEY (telescope_id) REFERENCES Telescopes(telescope_id),
                                  PRIMARY KEY(Night, telescope_id)
)