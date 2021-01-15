// function to convert a javascript date to be in an ISO format
function format_date_week(date) {
    let d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
}

// function to get dates for the day seven days ago from today and yesterday
// Example: 2019-12-02 and 2019-11-25
// We get back an array in this function
function date_for_week_ago(){
    let dt = new Date();
    dt.setDate( dt.getDate() - 7 );
    return [format_date_week(new Date()), format_date_week(dt)]
}

// function to plot the graph for the last 7 days based on the function above

function createPlot_week(allocated_time_week, unallocated_time_week) {

    let at_week = document.getElementById("third").getContext("2d");
    let week_chart = new Chart(at_week, {
        type: "bar",
        data: {
            labels: ["1.0-m", "1.9-m", "IRSF", "Lesedi"],
            datasets: [
                {
                    label: "allocated days",
                    data: allocated_time_week,
                    backgroundColor: "rgba(63,103,126,1)"
                },
                {
                    label: "unallocated days",
                    data: unallocated_time_week,
                    backgroundColor: "rgba(163,103,126,1)"
                }
            ]
        },
        options: {
            legend: {
                display:true,
                position: "bottom",
                labels: {
                    fontSize: 15,
                    fontColor:'black'
                }
            },
            plugins:{
                datalabels: {
                    display:false
                }
            },
            scales: {
                xAxes: [
                    {
                        ticks: {
                            fontSize: 15,
                            fontColor:'black'
                        },
                        stacked: true,
                        barPercentage: 0.5,
                    }
                ],
                yAxes: [{ scaleLabel:{display:true, labelString:'DAYS', fontSize:15, fontColor:'black'},
                    ticks: {fontSize: 16,fontColor:'black'}, stacked: true}]
            },
            label: {
                fontSize: 20
            }
        }
    });
}

const allocated_time_week = () => {

    // start and end dates for querying the api
    let query_parameter_start_date = date_for_week_ago()[1];
    let query_parameter_end_date = date_for_week_ago()[0];

    // querying the API for the data for each telescope based on the
    // start and end dates for the previous quarter in the current year
    // These urls take three parameters: start date, end date and telescope name

    let url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`;
    let url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;
    let url_irsf = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=IRSF`;
    let url_lesedi = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=Lesedi`;

//making calls to the API for each telescope to get the allocated and unallocated
// days for each telescope based on the rota

    const get_one_meter_data = d3.json(url_one_meter);
    const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);
    const get_irsf_data = d3.json(url_irsf);
    const get_lesedi_data = d3.json(url_lesedi)

    // variables to store the number of days an observer is not allocated
    // for observing and vice versa

    let allocated_count_one_meter = 0;
    let unallocated_count_one_meter = 0;

    let allocated_count_one_nine = 0;
    let unallocated_count_one_nine = 0;

    let allocated_count_IRSF = 0;
    let unallocated_count_IRSF = 0;

    let allocated_count_lesedi = 0;
    let unallocated_count_lesedi = 0;

    function getting_api_data(api_data) {
        api_data.forEach(data => {
            data.observation_details.forEach(value => {

                // reading the data from API and getting the allocated and unallocated days

                if (value.telescope === "1.9-m"  && value.scheduled_downtime_category !== "None"){
                    allocated_count_one_nine += 1;
                }

                if (value.telescope === "1.0-m"  && value.scheduled_downtime_category !== "None"){
                    allocated_count_one_meter += 1;
                }

                if (value.telescope === "IRSF" && value.scheduled_downtime_category !== "None"){
                    allocated_count_IRSF += 1;
                }

                if (value.telescope === "Lesedi" && value.scheduled_downtime_category !== "None"){
                    allocated_count_IRSF += 1;
                }

                // one meter(allocated and unallocated days)
                if (value.telescope === "1.0-m" && value.observer === "" && value.scheduled_downtime_category === "None") {
                    unallocated_count_one_meter += 1;
                }
                if (
                    value.telescope === "1.0-m" &&
                    value.observer !== "" &&
                    value.observer !== null
                ) {
                    allocated_count_one_meter += 1;
                }

                //one point nine meter (allocated and unallocated days)
                if (value.telescope === "1.9-m" && value.observer === ""
                    && value.scheduled_downtime_category === "None") {
                    unallocated_count_one_nine += 1;
                }
                if (
                    value.telescope === "1.9-m" &&
                    value.observer !== "" &&
                    value.observer !== null
                ) {
                    allocated_count_one_nine += 1;
                }

                //IRSF (allocated and unallocated days)
                if (value.telescope === "IRSF" && value.observer === "") {
                    unallocated_count_IRSF += 1;
                }
                if (
                    value.telescope === "IRSF" &&
                    value.observer !== "" &&
                    value.observer !== null
                ) {
                    allocated_count_IRSF += 1;
                }

                //Lesedi (allocated and unallocated days)
                if (value.telescope === "Lesedi" && value.observer === ""
                    && value.scheduled_downtime_category === "None") {
                    unallocated_count_lesedi += 1;
                }
                if (
                    value.telescope === "Lesedi" &&
                    value.observer !== "" &&
                    value.observer !== null
                ) {
                    allocated_count_lesedi += 1;
                }
            });
        });

        // Object to organize the data returned by the api and have access to it easily
        let telescope_data = [
            {
                allocated: allocated_count_one_meter,
                unallocated: unallocated_count_one_meter,
                telescope_name: "1 meter"
            },
            {
                allocated: allocated_count_one_nine,
                unallocated: unallocated_count_one_nine,
                telescope_name: "1.9 meter"
            },
            {
                allocated: allocated_count_IRSF,
                unallocated: unallocated_count_IRSF,
                telescope_name: "IRSF"
            },
            {
                allocated: allocated_count_lesedi,
                unallocated: unallocated_count_lesedi,
                telescope_name: "Lesedi"
            }
        ];

        // arrays to store the number allocated and unallocated days for each
        // telescope
        let allocated_time_array=[];
        let unallocated_time_array=[];

        telescope_data.map(function (d){
            allocated_time_array.push(d.allocated);
            unallocated_time_array.push(d.unallocated);
        });
        // We pass these arrays to the createPlot_week to plot the graph
        // for the last seven days based on the date_for_last_week_ago function
        createPlot_week(allocated_time_array, unallocated_time_array)
    }

    // using Promise.all so as to manage the requests for the each telescope and
    // combine that data for each telescope into one
    //
    Promise.all([
        get_one_meter_data,
        get_one_point_nine_meter_data,
        get_irsf_data,
        get_lesedi_data
    ])
        .then(getting_api_data)
        .catch(e => {
            console.error(e);
        });
};
