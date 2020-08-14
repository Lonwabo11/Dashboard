const shutter_open_time_month = () =>{

    // function to format a javascript date to be in ISO format
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


    // function to get the date for day before current one and 30 days
    // ago form the current day
    function get_last_30_days_dates() {
        let date = new Date();
        date.setDate(date.getDate() - 30);
        return [formatDate(new Date()), formatDate(date)];
    }

// function to plot a graph for the dome shutter open time for the 1.0-m and 1.9-m telescope

    function createPlots(shutter_open_time){
        Chart.defaults.global.legend.display = false;
        let sot_month = document.getElementById("eight").getContext("2d");
        let chart = new Chart(sot_month, {

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
                            "rgba(163,103,126,1)"],
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
                        {
                            scaleLabel:{
                                display:true,
                                labelString: 'HOURS',
                                fontColor:'black',
                                fontSize:15

                            },
                            ticks: {
                                beginAtZero: true,
                                fontColor:'black',
                                fontSize:15,
                                maxTicksLimit: 6
                            },
                            barPercentage:0.4
                        }
                    ],
                    xAxes:[{
                        ticks:{fontColor:'black', fontSize: 15},
                        barPercentage:0.4,
                        fontColor:'black'
                    }]
                },
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
    }

    // the query dates for the API  and the api calls to be made for each telescope(1.0-m and 1.9-m)
    let query_parameter_start_date = get_last_30_days_dates()[1],
        query_parameter_end_date = get_last_30_days_dates()[0],
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`,
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;

    // making the API calls for each telescope and we get back (Promises)
    const get_one_meter_data = d3.json(url_one_meter);
    const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);

    // variables to store the dome shutter open time for each telescope
    let sot_hours_one_meter=0;
    let total_sot_hours_one_meter = 0;

    let sot_hours_one_point_nine_meter=0;
    let total_sot_hours_one_point_nine_meter = 0;

    function getting_plot_data (api_data) {
        api_data.forEach(data => {
            data.observation_details.forEach(value => {

                // we go through the object returned by the API and get the dome shutter open times for
                // each telescope based on the time periods from the get_last_30_days function

                if (value.telescope === '1.9-m') {
                    sot_hours_one_point_nine_meter += value.dome_shutter_open_time;
                    total_sot_hours_one_point_nine_meter = (sot_hours_one_point_nine_meter/3600).toFixed(2)
                }

                if (value.telescope === '1.0-m') {
                    sot_hours_one_meter += value.dome_shutter_open_time;
                    total_sot_hours_one_meter = (sot_hours_one_meter/3600).toFixed(2)
                }

            })
        });
        let telescope_data = [
            { 'sot_hours': total_sot_hours_one_meter, telescope_name: "1 meter"},
            { 'sot_hours': total_sot_hours_one_point_nine_meter, telescope_name: "1.9 meter"}
        ];
        // this array will store the dome shutter open time for each telescope.
        let shutter_open_time_array = [];

        telescope_data.map(d => {
            shutter_open_time_array.push(d.sot_hours)
        });
        // we pass the shutter_open_time_array to createPlots function to plt the graph for
        //dome shutter open time
        createPlots(shutter_open_time_array)
    }


// using Promise.all so as to manage the requests for the each telescope and
// combine that data for each telescope into one
    Promise.all([get_one_meter_data,get_one_point_nine_meter_data]).then(
        getting_plot_data
    ).catch(e=>{
        console.error(e)
    })
};