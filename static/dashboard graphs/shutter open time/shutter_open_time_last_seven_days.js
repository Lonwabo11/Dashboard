
const shutter_open_time_week = () =>{
    // function to format the javascript date object to ISO format Ex:2019-01-02
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


// function to get dates for the day seven days ago from today and yesterday
// Example: 2019-12-02 and 2019-11-25
// We get back an array in this function

    function date_for_week_ago(){
        let dt = new Date();
        dt.setDate( dt.getDate() - 7 );
        return [formatDate(new Date()), formatDate(dt)]
    }

    // this function will plot the graph of shutter open time for the
    // last seven days on the dashboard endpoint
    function createPlots(shutter_open_time){
        Chart.defaults.global.legend.display = false;
        let sot_month = document.getElementById("nine").getContext("2d");
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
                                maxTicksLimit:6
                            },
                            barPercentage:0.4
                        }
                    ],
                    xAxes:[{
                        ticks:{fontColor:'black', fontSize: 15},
                        barPercentage:0.4,
                        fontColor:'black',

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

    // The query dates for the API and the API calls to be made for the
    // shutter open time for each telescope
    let query_parameter_start_date = date_for_week_ago()[1],
        query_parameter_end_date =date_for_week_ago()[0],
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`,
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;

    // making the calls to the API
    const get_one_meter_data = d3.json(url_one_meter);
    const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);


    let sot_hours_one_meter=0;
    let total_sot_hours_one_meter = 0;

    let sot_hours_one_point_nine_meter=0;
    let total_sot_hours_one_point_nine_meter = 0;

    //this function will get data for the last seven days from the API

    function getting_plot_data (api_data) {
        api_data.forEach(data => {
            data.observation_details.forEach(value => {

                // reading data from the object returned by the API to get dome shutter open time
                // for the last seven days
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

        let shutter_open_time_array = [];

        telescope_data.map(d => {
            shutter_open_time_array.push(d.sot_hours)
        });
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
