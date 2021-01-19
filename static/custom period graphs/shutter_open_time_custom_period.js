const cp_shutter_open_time= () => {

    let date_picker_one_value = document.getElementById("datePicker").value;
    let date_picker_two_value = document.getElementById("datePicker2").value;

    let query_parameter_start_date = date_picker_one_value;
    let query_parameter_end_date = date_picker_two_value;

    let url_one_meter = "";
    let url_one_point_nine_meter = "";

// We check to ensure that you have chosen a start date and an end date in the datepickers
    if (query_parameter_start_date !=='' && query_parameter_end_date !== ''){
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`;
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;

    }
// making the API calls for the dome shutter open time for each telescope
    // We get back a Promise in return
    const get_one_meter_data = d3.json(url_one_meter);
    const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);

// These variables store the dome shutter open time for each telescope
    let sot_hours_one_meter=0;
    let total_sot_hours_one_meter = 0;

    let sot_hours_one_point_nine_meter=0;
    let total_sot_hours_one_point_nine_meter = 0;

// This function will create a plot of the total hours for dome shutter open time
    // for the 1.0-m and 1.9-m telescope in the range of the dates you pick from the
    // datepickers using the chartjs library
    function createPlots(shutter_open_time){
        document.getElementById("cp_sot").innerHTML = '&nbsp;';
        document.getElementById("cp_sot").innerHTML = '<canvas id="third" style="height: 300px; width: 440px;"></canvas>';

        let cp_sot = document.getElementById("third").getContext("2d");
        let chart = new Chart(cp_sot, {

            type: "bar",
            data: {
                labels: [
                    "1.0-m",
                    "1.9-m"
                ],
                datasets: [
                    {
                        data: shutter_open_time,
                        fill: false,
                        backgroundColor: [
                            "rgba(63,103,126,1)",
                            "rgba(163,103,126,1)"
                        ],

                        borderWidth: 1
                    }
                ]
            },
            options: {
                plugins:{
                    datalabels: {
                        display:false
                    }
                },
                scales: {
                    yAxes: [
                        { scaleLabel:{display:true, labelString:'HOURS', fontColor:'black', fontSize:15},
                            ticks: {
                                beginAtZero: true,
                                fontColor:'black',
                                fontSize:15,
                                maxTicksLimit:8
                            },
                            barPercentage:0.5
                        }
                    ],
                    xAxes:[{scaleLabel:{display: true, labelString: 'Telescopes', fontColor:'black', fontSize:15},
                        ticks:{fontColor:'black', fontSize:15},
                        barPercentage:0.4,
                        fontColor:'black',

                    }]
                },
                responsive:false,
                tooltips:{
                    callbacks:{
                        label: function (tooltipItem) {
                            let n= Number(tooltipItem.yLabel);
                            let hour=Math.floor(n);
                            let minute= ((n-hour)*60).toFixed(0);
                            return hour+'h'+minute+'m';
                        }
                    }
                }
            }
        });
        const isAllZero = shutter_open_time.every(item => item === '0.00')
        if (isAllZero === true){
            document.getElementById('no-data-sot').style.display = 'block'
            document.getElementById("cp_sot").style.display = 'none'
        }
        else{
            document.getElementById('no-data-sot').style.display = 'none'
        }
    }

// We check that the start date chosen in your datepicker is less the the end date and then we use Promise.all to combine all
    // our API calls into one call to increase speed of the app.
    if (query_parameter_start_date < query_parameter_end_date){
        Promise.all([get_one_meter_data, get_one_point_nine_meter_data]).then(
            telescopeData => {
                telescopeData.forEach(data => {
                    data.observation_details.forEach(value => {

                        if (value.telescope === '1.9-m'){
                            sot_hours_one_point_nine_meter += value.dome_shutter_open_time;
                            total_sot_hours_one_point_nine_meter= (sot_hours_one_point_nine_meter/3600).toFixed(2)
                        }

                        if (value.telescope === '1.0-m'){
                            sot_hours_one_meter+= value.dome_shutter_open_time;
                            total_sot_hours_one_meter= (sot_hours_one_meter/3600).toFixed(2)
                        }

                    });
                });
                // this array will store the shutter open times for each telescope(1.0-m and 1.9-m)
                // in the chosen date range(datepickers)
                let shutter_open_time_array =[];

                let telescope_data = [
                    { 'hours': total_sot_hours_one_meter, telescope_name: "1 meter" },
                    { 'hours': total_sot_hours_one_point_nine_meter, telescope_name: "1.9 meter" },

                ];
// We use map to append to the shutter_open_time_array and pass this array to the createPlots function to plot the graph
                telescope_data.map(d=>{
                    shutter_open_time_array.push(d.hours)
                });

                createPlots(shutter_open_time_array)
            }
            // We catch any exceptions
        ).catch(e=>{
            console.error('The error is ', e)
        });
    }

};



