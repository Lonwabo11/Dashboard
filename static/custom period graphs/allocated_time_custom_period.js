const cp_allocated_time = () => {
    // the date picker dates, these dates determine the range for the date you want to see
    let date_picker_one_value = document.getElementById("datePicker").value;
    let date_picker_two_value = document.getElementById("datePicker2").value;

    // We store the datepicker dates in the variables below for easy manipulation
    let query_parameter_start_date = date_picker_one_value;
    let query_parameter_end_date = date_picker_two_value;


    let url_one_meter = "";
    let url_one_point_nine_meter = "";
    let url_irsf = "";

// We ensure that there are dates chosen in the datepickers by checking to see if their value is empty or not, hence the check via
    //the if statement. Inside the if statement, we give the api calls to be made for each telescope

    if (query_parameter_start_date!== '' && query_parameter_end_date !== ''){
        url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`;
        url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;
        url_irsf = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=IRSF`;
    }

// making the api calls to the API for each telescope
    const get_one_meter_data = d3.json(url_one_meter);
    const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);
    const get_irsf_data = d3.json(url_irsf);

// These variables will store the allocated and unallocated observation days from the observation rota for each telescope
    let allocated_count_one_meter = 0;
    let unallocated_count_one_meter = 0;

    let allocated_count_one_nine = 0;
    let unallocated_count_one_nine = 0;

    let allocated_count_IRSF = 0;
    let unallocated_count_IRSF = 0;

    function createPlots(allocated_time, unallocated_time){
        // the following two lines are re-drawing the chart so as to not stack one chart on top of another when redrawing a chart
        document.getElementById("cp_at").innerHTML = '&nbsp;';
        document.getElementById("cp_at").innerHTML = '<canvas id="first" style="height: 300px; width: 440px;"></canvas>';

        let at_trimester = document.getElementById("first").getContext("2d");
        let trimester_chart = new Chart(at_trimester, {

            type: "bar",
            data: {
                labels: ["1.0-m", "1.9-m", "IRSF"],
                datasets: [
                    {
                        label: "allocated days",
                        data: allocated_time,
                        backgroundColor: 'rgba(63,103,126,1)'
                    },
                    {
                        label: "unallocated days",
                        data: unallocated_time,
                        backgroundColor: 'rgba(163,103,126,1)'
                    }
                ]
            },
            options: {
                legend: {
                    display:true,
                    position: "bottom",
                    labels: {
                        fontSize: 15,
                        fontColor: 'black'
                    }
                },
                plugins:{
                    datalabels: {
                        display:false
                    }
                },
                scales: {
                    xAxes: [
                        { scaleLabel:{display: true, labelString: 'Telescopes', fontColor:'black', fontSize:15},
                            ticks: {
                                fontSize: 15,
                                fontColor: 'black'
                            },
                            stacked: true,
                            barPercentage: 0.4
                        }
                    ],
                    yAxes: [
                        {scaleLabel:{
                                display:true,
                                labelString:'DAYS',
                                fontSize:15,
                                fontColor:'black'
                            },
                            ticks: { fontSize: 16,
                                fontColor: 'black',
                                maxTicksLimit: 6
                            },
                            stacked: true,
                        }
                    ]
                },
                responsive: false,
                maintainAspectRatio:false
            }
        });
    }

// We ensure that your chosen start date must be less than your chosen end date in the datepickers,
    // then we combine all the api calls(Promises) to a single call using Promise.all
    if (query_parameter_start_date < query_parameter_end_date ){
        Promise.all([get_one_meter_data, get_one_point_nine_meter_data, get_irsf_data]).then(
            telescopeData => {
                telescopeData.forEach(data => {
                    data.observation_details.forEach(value => {
                        // We check for the allocate and unallocated observation days for each telescope.
                        // If we have scheduled downtime like Engineering or Aluminising, we take the day as unallocated and vice versa for allocated days
                        // When an observer is not assigned on a day, we also count it as unallocated and vice versa for allocated days

                        if (value.telescope === "1.9-m" && value.scheduled_downtime_category !== 'None'){
                            allocated_count_one_nine += 1;
                        }

                        if (value.telescope === "1.0-m" && value.scheduled_downtime_category !== 'None'){
                            allocated_count_one_meter += 1;
                        }

                        if (value.telescope === "IRSF" && value.scheduled_downtime_category !== 'None'){
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
                    });
                });

                let TelescopeData = [
                    {
                        allocated: allocated_count_one_meter,
                        unallocated: unallocated_count_one_meter,
                        TelescopeName: "1 meter"
                    },
                    {
                        allocated: allocated_count_one_nine,
                        unallocated: unallocated_count_one_nine,
                        TelescopeName: "1.9 meter"
                    },
                    {
                        allocated: allocated_count_IRSF,
                        unallocated: unallocated_count_IRSF,
                        TelescopeName: "IRSF"
                    }
                ];

                // Since chart.js library requires to read data from an array, these two arrays will store the
                // data for allocated and unallocated days for each telescope
                let allocated_time_array =[];
                let unallocated_time_array =[];

                // We use map to read for the TelescopeData object and store the unallocated and allocated days
                // in arrays above
                TelescopeData.map(d=>{
                    allocated_time_array.push(d.allocated);
                    unallocated_time_array.push(d.unallocated);
                });
                // We call the createPlots method to plot the graph for allocated days and
                //unallocated days in the observation rota
                createPlots(allocated_time_array, unallocated_time_array);
            }
        );
    }

};
