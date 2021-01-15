// function to format the date so its ISO Format Ex: 2019-01-02 since javascript uses Ex: 2019/01/02
function format_date(date) {
    let d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
}

// this function will get the dates for the start and end of the previous trimester
// based on the current one and return them as an array

function get_last_trimester_dates(trimester) {
    let date = new Date();
    let year = date.getFullYear();

    let start_of_trimester = null;
    let end_of_trimester = null;

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

    return [format_date(start_of_trimester), format_date(end_of_trimester)];
}

// This function will create the Plot for the allocated days vs unallocated days based on the rota for
// the last trimester in relation to thr current trimester

function createPlot_trimester(allocated_time, unallocated_time) {
    let at_trimester = document.getElementById("first").getContext("2d");
    let trimester_chart = new Chart(at_trimester, {
        type: "bar",
        data: {
            labels: ["1.0-m", "1.9-m", "IRSF", "Lesedi"],
            datasets: [
                {
                    label: "allocated days",
                    data: allocated_time,
                    backgroundColor: "rgba(63,103,126,1)"
                },
                {
                    label: "unallocated days",
                    data: unallocated_time,
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
                yAxes: [
                    { scaleLabel:{
                            display:true,
                            labelString:'DAYS',
                            fontColor:'black',
                            fontSize:15
                        },
                        ticks: { fontSize: 16, fontColor:'black', maxTicksLimit: 6 },
                        stacked: true,
                    },
                ]
            },
            label: {
                fontSize: 20,
                fontColor:'black'
            },
            responsive: false
        }
    });
}

const allocated_time_trimester = () => {


    let previous_trimester = null;

    let current_trimester = Math.round((new Date().getMonth() - 1) / 3 + 1);


    if (current_trimester === 1) {
        previous_trimester = 0;
    }

    if (current_trimester === 2) {
        previous_trimester = 1;

    }

    if (current_trimester === 3) {
        previous_trimester = 2;
    }

    if (current_trimester === 4) {
        previous_trimester = 3;
    }

    // start and end dates for querying the api
    // querying the API for the data for each telescope based on the
    // start and end dates for the previous trimester in the current year
    // These urls take three parameters: start date, end date and telescope name

    let query_parameter_start_date = get_last_trimester_dates(previous_trimester)[0],
        query_parameter_end_date = get_last_trimester_dates(previous_trimester)[1],
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`,
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`,
        url_irsf = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=IRSF`,
        url_lesedi = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=Lesedi`;

// Making the API calls for  each telescope

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

    // function to create the plot of the last trimester of the current year based on the start and end dates
    // provided by the get_last_trimester_dates_function

    function getting_api_data(api_data) {
        api_data.forEach(data => {
            data.observation_details.forEach(value => {

                // reading the data from API and getting the allocate and unallocated days
                // for each telescope

                if (
                    value.telescope === "1.9-m" &&
                    value.scheduled_downtime_category !== "None"
                ) {
                    allocated_count_one_nine += 1;
                }

                if (
                    value.telescope === "1.0-m" &&
                    value.scheduled_downtime_category !== "None"
                ) {
                    allocated_count_one_meter += 1;
                }

                if (
                    value.telescope === "IRSF" &&
                    value.scheduled_downtime_category !== "None"
                ) {
                    allocated_count_IRSF += 1;
                }

                // one meter(allocated and unallocated days)
                if (value.telescope === "1.0-m" && value.observer === "") {
                    unallocated_count_one_meter += 1;
                }
                if (
                    value.telescope === "1.0-m" &&
                    value.observer !== "" &&
                    value.observer !== null
                ) {
                    allocated_count_one_meter += 1;
                }
                if (
                    value.telescope === "Lesedi" &&
                    value.scheduled_downtime_category !== "None"
                ) {
                    allocated_count_lesedi += 1;
                }


                //one point nine meter (allocated and unallocated days)
                if (value.telescope === "1.9-m" && value.observer === "") {
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

                if (value.telescope === "Lesedi" && value.observer !== "" && value.observer !== null){
                    allocated_count_lesedi +=1
                }
                if (value.telescope === "Lesedi" && value.observer === "" &&
                    value.scheduled_downtime_category === "None"){
                    unallocated_count_lesedi += 1
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
        // these arrays will store the data we will use to plot with. They store the
        // allocated and unallocated days fro each telescope based on the rota
        let allocated_time_array = [];
        let unallocated_time_array = [];

        telescope_data.map(function(d) {
            allocated_time_array.push(d.allocated);
            unallocated_time_array.push(d.unallocated);
        });
        createPlot_trimester(allocated_time_array, unallocated_time_array);
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
