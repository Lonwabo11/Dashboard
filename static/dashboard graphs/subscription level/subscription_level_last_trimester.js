
const subscription_level_trimester = () => {

  // function to get the start and end dates for each trimester
  function get_trimester(date){
    let  trimester_object = {};
    if (date.getMonth() + 1 >= 1 && date.getMonth() + 1 <= 4) {
      trimester_object= {'year': date.getFullYear(), 'trimester': 1}
    }
    else if (date.getMonth() + 1 >= 5 && date.getMonth() + 1 < 9) {
      trimester_object= {'year': date.getFullYear(), 'trimester': 2}
    }
    else if (date.getMonth() + 1 >= 9 && date.getMonth() + 1 < 13) {
      trimester_object= {'year': date.getFullYear(), 'trimester': 3}
    }
    return trimester_object
  }

  // function to plot the graph for the subscription level of each telescope
  // for the previous trimester based on the current trimester
  function createPlots(data) {
    Chart.defaults.global.legend.display = false;
    let mychart = document.getElementById("ten").getContext("2d");
    var chart = new Chart(mychart, {

      type: "bar",
      data: {
        labels: [
          "1.0-m",
          "1.9-m"
        ],
        datasets: [
          {
            data: data,
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
                labelString:"PERCENTAGE",
                fontSize:15,
                fontColor:'black'
              },
              ticks: {
                beginAtZero: true,
                fontColor:'black',
                fontSize:15,
                callback: function (value) {
                  return value + '%'
                }
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
          callbacks: {
            label:function (tooltipItem){
              return (tooltipItem.yLabel+'%')
            }
          }
        }
      }
    });
  }

  let subscription_level_one_meter = 0;
  let subscription_level_one_point_nine_meter = 0;

  // today's date

  let date_today = new Date();

  // we get our trimester based on today's date
  let year_and_trimester = get_trimester(date_today);
  // this is the year of the trimester retrieved above
  let current_year=year_and_trimester.year;
  // trimester in the year above
  let current_trimester=year_and_trimester.trimester;

// API requests for the subscription level data for each telescope

  if (current_trimester === 1){
    current_year = current_year-1;
    current_trimester = 3
  }

  let api_request_40_inch = d3.json(`/subscription_level?year=${current_year}
                                      &trimester=${current_trimester}&telescope=1.0-m`);
  let api_request_74_inch = d3.json(`/subscription_level?year=${current_year}
                                      &trimester=${current_trimester}&telescope=1.9-m`);

  function getting_api_data_from_request(api_data) {
    api_data.forEach( data => {
      //reading the data from the API calls to get the subscription level of each telescope

      data.subscription_level.forEach( value=> {
        if (value.telescope_name === '1.0-m'){
          subscription_level_one_meter += value.subscription;
        }
        if (value.telescope_name ==='1.9-m'){
          subscription_level_one_point_nine_meter += value.subscription
        }
      })
    });

    let subscription_level_array = [];
    subscription_level_array.push(subscription_level_one_meter, subscription_level_one_point_nine_meter);
    createPlots(subscription_level_array)
  }
  Promise.all([api_request_40_inch, api_request_74_inch])
      .then(getting_api_data_from_request)
      .catch(error=>{
        console.error(error)
      })
};
