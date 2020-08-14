
const weather_down_time_week= () => {

// function to format a javascript date object to ISO format Ex: 2019-01-02
    const formatDate = date => {

        let d, month, day, year;
        d = new Date(date);
        month = '' + (d.getMonth() + 1);
        day = '' + d.getDate();
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
    };


// function to get date for the day before the current date and
// the date  for the day seven days ago

    function date_for_week_ago(){
        let dt = new Date();
        dt.setDate( dt.getDate() - 7 );
        return [formatDate(new Date()), formatDate(dt)]
    }

    // function to create the plot for the last seven days on the dashboard endpoint

    function createPlot_wdt_week(weather_downtime, overall_time, downtime) {
        let overall_hours = Math.floor(overall_time/3600);
        let overall_minutes =(((overall_time/3600) % 1) * 60).toFixed(0);

        let downtime_hours=Math.floor(downtime/3600);
        let downtime_minutes = (((downtime/3600) % 1) * 60).toFixed(0);

        if (downtime_hours < 10){
            downtime_hours='0'+downtime_hours
        }
        if (downtime_minutes < 10){
            downtime_minutes = '0'+downtime_minutes
        }

        if (overall_hours < 10){
            overall_hours='0'+overall_hours
        }
        if (overall_minutes < 10){
            overall_minutes = '0'+overall_minutes
        }



        let wdt_chart = document.getElementById("six").getContext("2d");
        var chart = new Chart(wdt_chart, {
            type: "pie",
            data:{
                datasets:[{
                    data:weather_downtime,
                    backgroundColor:['rgba(63,103,126,1)', 'rgba(163,103,126,1)']
                }],
                labels:['overall observation time:'+' '+overall_hours+'h'+overall_minutes+'m', 'weather downtime:'+' '+downtime_hours+'h'+downtime_minutes+'m']
            },
            options:{
                legend:{
                    display:true,
                    position:'bottom',
                    labels: {
                        fontColor:'black',
                        fontSize:15
                    }
                },
                plugins: {
                    datalabels: {
                        color: '#fff',
                        backgroundColor: (context) => {
                            return context.dataset.backgroundColor;
                        },
                        font: {
                            weight: 'bold',
                            size: '10'
                        },
                        formatter: (value) => {
                            return parseFloat(value).toFixed(2) + ' %';
                        }
                    }
                },
                tooltips:{
                    callbacks:{
                        label: function (tooltipItem, chartData) {
                            return chartData.labels[tooltipItem.index] + ': ' + chartData.datasets[0].data[tooltipItem.index] + '%';
                        }
                    }
                },
                responsive:false,
                maintainAspectRatio:true
            }
        });
    }

// start and end dates for the querying the api
    // querying the API for the data for each telescope based on the
    // start and end dates for the previous trimester in the current year
    // These urls take three parameters: start date, end date and telescope name
    let query_parameter_start_date = date_for_week_ago()[1],
        query_parameter_end_date = date_for_week_ago()[0],
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`,
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`,
        url_irsf = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=IRSF`;


    const get_one_meter_data = d3.json(url_one_meter),
        get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter), get_irsf_data = d3.json(url_irsf);

    // these variables will store the weather downtime fro each telescope
    // and the  total_observation_time is time difference between the end and start
    // of twilight for ach night

    let wdt_hours_one_meter = 0, total_wdt_hours_one_meter = 0, wdt_hours_one_point_nine_meter = 0,
        total_wdt_hours_one_point_nine_meter = 0, wdt_hours_IRSF = 0, total_wdt_hours_IRSF = 0,
        total_observation_time = 0;

    // This function reads the API response and stores the weather downtime
    // data for each telescope in an object to be easily manipulated for plotting
    // the graph
    const getting_api_data = api_data => {

        api_data.forEach(data=>{
            data.observation_details.forEach(value => {

                if (value.telescope === '1.9-m'){
                    wdt_hours_one_point_nine_meter += value.weather_downtime;
                    total_wdt_hours_one_point_nine_meter = wdt_hours_one_point_nine_meter;
                    total_observation_time+= value.night_length;
                }

                if (value.telescope === '1.0-m'){
                    wdt_hours_one_meter += value.weather_downtime;
                    total_wdt_hours_one_meter = wdt_hours_one_meter;
                    total_observation_time += value.night_length;
                }
                if (value.telescope === 'IRSF'){
                    wdt_hours_IRSF += value.weather_downtime;
                    total_wdt_hours_IRSF = wdt_hours_IRSF;
                    total_observation_time += value.night_length;
                }

            })});

// Object to organize the data returned by the api and have access to it easily
        let telescope_data_7_days = [
                {'wdt_hours': total_wdt_hours_one_meter, telescope_name: "1 meter", total_time: total_observation_time},
                {
                    'wdt_hours': total_wdt_hours_one_point_nine_meter,
                    telescope_name: "1.9 meter",
                    total_time: total_observation_time
                },
                {'wdt_hours': total_wdt_hours_IRSF, telescope_name: "IRSF", total_time: total_observation_time}
            ], good_weather, bad_weather = 0, good_weather_fraction, bad_weather_fraction = 0, good_weather_percentage = 0,
            bad_weather_percentage = 0, weather_downtime_array = [], overall_time=0;

        // The object above has the weather downtime data from the API response

        // we use the variables above to store the good weather and the bad weather for  each night.
        // the good_weather_fraction is the quotient of the non-weather downtime and overall time
        // between twilight and the the bad weather fraction is vice versa(bad_weather/total_time_period)


        // the good_weather_percentage is good_weather_fraction*100 and for
        // the bad_weather_percentage its bad_weather_fraction*100


        telescope_data_7_days.map(function(d) {

            good_weather= d.total_time- d.wdt_hours;
            bad_weather = d.wdt_hours;
            overall_time = d.total_time;

            bad_weather_fraction= bad_weather/ d.total_time;
            good_weather_fraction= good_weather/d.total_time;

            good_weather_percentage = (good_weather_fraction * 100).toFixed(2);
            bad_weather_percentage = (bad_weather_fraction * 100).toFixed(2);
        });
        weather_downtime_array.push(good_weather_percentage, bad_weather_percentage);
        createPlot_wdt_week(weather_downtime_array, overall_time, bad_weather)
    };


// using Promise.all so as to manage the requests for the each telescope and
// combine that data for each telescope into one
    Promise.all([get_one_meter_data, get_one_point_nine_meter_data,get_irsf_data]).then(
        getting_api_data
    ).catch(e=>{
        console.error(e)
    })

};
