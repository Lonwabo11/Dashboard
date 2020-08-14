// function to draw the plot for the weather downtime for the telescopes.

function createPlots(weather_downtime, overall_time, downtime){

    let overall_hours = Math.floor(overall_time/3600);
    let overall_minutes =(((overall_time/3600) % 1) * 60).toFixed(0);

    let downtime_hours=Math.floor(downtime/3600);
    let downtime_minutes = (((downtime/3600) % 1) * 60).toFixed(0);

    document.getElementById("cp_wdt").innerHTML = '&nbsp;';
    document.getElementById("cp_wdt").innerHTML = '<canvas id="second" style="height: 300px; width: 440px;"></canvas>';

    let cp_wdt_chart = document.getElementById("second").getContext("2d");

    let chart = new Chart(cp_wdt_chart, {
        type: "pie",
        data:{
            datasets:[{
                data:weather_downtime,
                backgroundColor:['rgba(63,103,126,1)', 'rgba(163,103,126,1)']
            }],
            labels:['overall time:'+' '+overall_hours+'h'+overall_minutes+'m', 'weather downtime:'+' '+downtime_hours+'h'+downtime_minutes+'m']
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
            plugins:{
              datalabels:{
                  color: '#fff'
              }
            },
            tooltips:{
                callbacks:{
                    label: function (tooltipItem, chartData) {
                        return chartData.labels[tooltipItem.index] + ': ' + chartData.datasets[0].data[tooltipItem.index] + '%';
                    }
                }
            },
            responsive: false
        }
    });

}

const cp_weather_down_time= ()=> {

    // the values of the datepickers
    let date_picker_one_value = document.getElementById("datePicker").value;
    let date_picker_two_value = document.getElementById("datePicker2").value;

//We store these values on the the following variables so they are easy to manipulate
    let query_parameter_start_date = date_picker_one_value;
    let query_parameter_end_date = date_picker_two_value;

// variables to store the queries to be sent to the API for each telescope
    let url_one_meter = "";
    let url_one_point_nine_meter = "";
    let url_irsf = "";

// We check that the start date and the end date are both not empty and store the queries to be made to the API for each telescope
    if (query_parameter_start_date !== "" && query_parameter_end_date !== ""){
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`;
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;
        url_irsf = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=IRSF`;

    }

// We make the API calls to get the weather downtime for each telescope using data gathered from
    // the sdb database so all the telescopes have the same weather downtime
    const get_one_meter_data = d3.json(url_one_meter);
    const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);
    const get_irsf_data = d3.json(url_irsf);

// variables to hold the weather downtime and twilight times per night for each telescope
    let wdt_hours_one_meter= 0;

    let wdt_hours_one_point_nine_meter=0;

    let wdt_hours_IRSF = 0;

    let total_observation_time_40_inch = 0;
    let total_observation_time_74_inch = 0;
    let total_observation_time_irsf = 0;


    // We make sure that the query start date is less than the query end date
    if (query_parameter_start_date < query_parameter_end_date){
        Promise.all([get_one_meter_data, get_one_point_nine_meter_data, get_irsf_data]).then(
            telescopeData => {
                let night_length_per_trimester_per_telescope = {
                    "1.0-m": 0,
                    "1.9-m": 0,
                    "IRSF": 0,
                };

                telescopeData.forEach(data => {
                    data.observation_details.forEach(value => {

                        night_length_per_trimester_per_telescope[value.telescope] += value.night_length;

//   We go through the object returned by our our Promise.all and then we store the weather downtime for each telescope and
                        // the total time period between twilight for each observation night
                        if (value.telescope === '1.9-m'){
                            wdt_hours_one_point_nine_meter+= value.weather_downtime;
                            total_observation_time_74_inch += value.night_length;
                        }

                        if (value.telescope === '1.0-m'){
                            wdt_hours_one_meter += value.weather_downtime;
                            total_observation_time_40_inch += value.night_length;

                        }
                        if (value.telescope === 'IRSF'){
                            wdt_hours_IRSF+= value.weather_downtime;
                            total_observation_time_irsf+= value.night_length;
                        }

                    });
                });

                let telescope_data = [
                    { 'hours': wdt_hours_one_meter, telescope_name: "1 meter" , total_time_40_inch:total_observation_time_40_inch},
                    { 'hours': wdt_hours_one_point_nine_meter, telescope_name: "1.9 meter", total_time_74_inch:total_observation_time_74_inch },
                    { 'hours': wdt_hours_IRSF , telescope_name:"IRSF", total_time_irsf:total_observation_time_irsf }
                ];

                // we use these variables to store the good weather and the bad weather for  each night.
                // the good_weather_fraction is the quotient of the non-weather downtime and overall time
                // between twilight and the the bad weather fraction is vice versa(bad_weather/total_time_period)
                let good_weather, bad_weather=0;
                let good_weather_fraction, bad_weather_fraction = 0;

                // the good_weather_percentage is good_weather_fraction*100 and for
                // the bad_weather_percentage its bad_weather_fraction*100
                let good_weather_percentage=0;
                let bad_weather_percentage = 0;
                let overall_time=0;

                // we store the weather downtime
                let weather_downtime_array =[];

                telescope_data.map(d=>{

                    good_weather= d.total_time_irsf- d.hours;
                    bad_weather = d.hours;
                    overall_time=night_length_per_trimester_per_telescope.IRSF;

                    bad_weather_fraction= bad_weather/ d.total_time_irsf;
                    good_weather_fraction= good_weather/d.total_time_irsf;

                    good_weather_percentage = (good_weather_fraction * 100).toFixed(2);
                    bad_weather_percentage = (bad_weather_fraction * 100).toFixed(2);

                });

                weather_downtime_array.push(good_weather_percentage, bad_weather_percentage);
                // we then call the createPlots function to draw the pie chart for the weather downtime vs the total
                // time period of twilight for each night
                createPlots(weather_downtime_array, overall_time, bad_weather)
            }
        ).catch(e=>{
            console.error(e)
        });
    }
};
