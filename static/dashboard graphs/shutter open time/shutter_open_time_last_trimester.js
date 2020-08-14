
const shutter_open_time_trimester= () => {

// function to format the date so its more presentable Ex: 2019-01-02
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

// function to get the start and end date for previous trimester in a year
    //based on the current trimester  Example: if current trimester is 1, then it will
    // return (2019-01-01, 2019-03-31)
    const get_last_trimester_dates = trimester => {

        let date = new Date();
        let year = date.getFullYear();

        let start_of_trimester;
        let end_of_trimester;

        if (trimester === 0){
            start_of_trimester = new Date(year-1,9, 2 );
            end_of_trimester = new Date(year,0,1  )

        }
        else if (trimester === 1) {
            start_of_trimester = new Date(year, 0, 1);
            end_of_trimester = new Date(year, 3, 2);
        } else if (trimester === 2) {
            start_of_trimester = new Date(year, 3, 2);
            end_of_trimester = new Date(year, 6, 2);
        } else if (trimester === 3) {
            start_of_trimester = new Date(year, 6, 2);
            end_of_trimester = new Date(year, 9, 1);
        } else {
            start_of_trimester = new Date(year, 9, 2);
            end_of_trimester = new Date(year + 1, 0, 1);
        }

        return [formatDate(start_of_trimester), formatDate(end_of_trimester)];
    };


    let previous_trimester = null;
    let current_trimester = Math.round((new Date().getMonth() - 1) / 3 + 1);

    if (current_trimester === 1){
        previous_trimester = 0
    }

    if (current_trimester === 2){
        previous_trimester = 1
    }

    if (current_trimester === 3){
        previous_trimester = 2
    }

    if (current_trimester === 4){
        previous_trimester = 3
    }


// start and end dates for the querying the api
    // querying the API for the data for each telescope based on the
    // start and end dates for the previous trimester in the current year
    // These urls take three parameters: start date, end date and telescope name
    let query_parameter_start_date = get_last_trimester_dates(previous_trimester)[0],
        query_parameter_end_date = get_last_trimester_dates(previous_trimester)[1],
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`,
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;


// reading the data from API, cleaning it and getting the allocate and unallocated days from it

    const getOneMeterData = d3.json(url_one_meter);
    const getOnePointNineMeter = d3.json(url_one_point_nine_meter);

// variables to store the number of days an observer is not allocated
// for observing and vice versa

    let sot_hours_one_meter=0;
    let total_sot_hours_one_meter = 0;

    let sot_hours_one_point_nine_meter=0;
    let total_sot_hours_one_point_nine_meter = 0;


    function createPlot(shutter_open_time){
        Chart.defaults.global.legend.display = false;
        let sot_trimester = document.getElementById("seven").getContext("2d");
        var chart = new Chart(sot_trimester, {

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
                        { scaleLabel:{
                                display:true,
                                labelString: 'HOURS',
                                fontColor:'black',
                                fontSize:15

                            },
                            ticks: {
                                beginAtZero: true,
                                fontColor:'black',
                                fontSize:15, maxTicksLimit:8
                            },
                            barPercentage:0.4
                        }
                    ],
                    xAxes:[{
                        ticks:{fontColor:'black',  fontSize: 15},
                        barPercentage:0.4,
                        fontColor:'black',

                    }]
                },

                legend:{

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

    function getting_plot_data (api_data) {
        api_data.forEach(data=>{
            data.observation_details.forEach(value=>{

                if (value.telescope === '1.9-m'){
                    sot_hours_one_point_nine_meter+= value.dome_shutter_open_time;
                    total_sot_hours_one_point_nine_meter = (sot_hours_one_point_nine_meter/3600).toFixed(2)
                }

                if (value.telescope === '1.0-m'){
                    sot_hours_one_meter+= value.dome_shutter_open_time;
                    total_sot_hours_one_meter= (sot_hours_one_meter/3600).toFixed(2)
                }

            })});


        let telescope_data = [
            { 'sot_hours': total_sot_hours_one_meter, telescope_name: "1 meter"},
            { 'sot_hours': total_sot_hours_one_point_nine_meter, telescope_name: "1.9 meter"}
        ];

        let shutter_open_time_array = [];

        telescope_data.map(d => {
            shutter_open_time_array.push(d.sot_hours)
        });
        createPlot(shutter_open_time_array)
    }


// using Promise.all so as to manage the requests for the each telescope and
// combine that data for each telescope into one
    Promise.all([getOneMeterData, getOnePointNineMeter]).then(
        getting_plot_data
    ).catch(e=>{
        console.error(e)
    })

};
