// function to get the dates for the last  30 days (excluding today)
// Example 01 Dec 2019 and 02 Nov 2019

function get_last_30_days_dates() {
  let date = new Date();
  date.setDate(date.getDate() - 30);
  return [format_date(new Date()), format_date(date)];
}

// this function will create the plot for allocated time vs unallocated time in the dashboard
// endpoint

function createPlot_month(allocated_time, unallocated_time) {

  let at_month = document.getElementById("second").getContext("2d");
  let month_chart = new Chart(at_month, {
    type: "bar",
    data: {
      labels: ["1.0-m", "1.9-m", "IRSF"],
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
            barPercentage: 0.4
          }
        ],
        yAxes: [
          { scaleLabel:{
              display:true,
              labelString:'DAYS',
              fontSize:15,
              fontColor:'black'
            },
            ticks: {
              fontSize: 16,
              fontColor:'black'
            },
            stacked: true
          }
        ]
      },
      label: {
        fontSize: 20
      },
      responsive: false
    }
  });
}

const allocated_time_month = () => {

  // start and end dates for querying the api
  let query_parameter_start_date = get_last_30_days_dates()[1];
  let query_parameter_end_date = get_last_30_days_dates()[0];

  // querying the API for the data for each telescope based on the
  // start and end dates for last 30 days in the current year
  // These urls take three parameters: start date, end date and telescope name

  let url_one_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.0-m`;
  let url_one_point_nine_meter = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=1.9-m`;
  let url_irsf = `/night-info?start_date=${query_parameter_start_date}&end_date=${query_parameter_end_date}&telescope=IRSF`;

  const get_one_meter_data = d3.json(url_one_meter);
  const get_one_point_nine_meter_data = d3.json(url_one_point_nine_meter);
  const get_irsf_data = d3.json(url_irsf);

  // variables to store the number of days an observer is not allocated
  // for observing and vice versa

  let allocated_count_one_meter = 0;
  let unallocated_count_one_meter = 0;

  let allocated_count_one_nine = 0;
  let unallocated_count_one_nine = 0;

  let allocated_count_IRSF = 0;
  let unallocated_count_IRSF = 0;

  // This function will fetch the data need for the last 30 days for allocated time vs unallocated time
  // as shown in the rota

  function getting_api_data(api_data) {
    api_data.forEach(data => {
      data.observation_details.forEach(value => {

        // reading the data from API and getting the allocated and unallocated days

        if (value.telescope === "1.9-m" && value.scheduled_downtime_category !== "None"){
          allocated_count_one_nine += 1;
        }

        if (value.telescope === "1.0-m"  && value.scheduled_downtime_category !== "None"){
          allocated_count_one_meter += 1;
        }

        if (value.telescope === "IRSF"  && value.scheduled_downtime_category !== "None"){
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
      }
    ];
    // these arrays store the number of allocated and allocated days
    // for each of the steerable telescopes
    let allocated_time_array=[];
    let unallocated_time_array=[];

    // we the add the data from the API output to these variables and pass the to the createPlot_month
    // function which creates the plot for the last 30 days(allocated time vs unallocated time)
    telescope_data.map(function (d){
      allocated_time_array.push(d.allocated);
      unallocated_time_array.push(d.unallocated);
    });

    createPlot_month(allocated_time_array, unallocated_time_array)
  }

  // using Promise.all so as to manage the requests for the each telescope and
  // combine that data for each telescope into one, we then catch any errors which may arise
  Promise.all([
    get_one_meter_data,
    get_one_point_nine_meter_data,
    get_irsf_data
  ])
      .then(getting_api_data)
      .catch(e => {
        console.error(e);
      });
};
