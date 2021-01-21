// This function determines which trimester do two dates fall in. The dates are from the datepickers
function get_trimesters(start_month, end_month) {

    if (start_month.getMonth() + 1 >= 1 && end_month.getMonth() + 1 <= 4) {
        return [1];
    }
    else if (start_month.getMonth() + 1 >= 5 && end_month.getMonth() + 1 <= 8) {
        return [2];
    }
    else if (start_month.getMonth() + 1 >= 9 && end_month.getMonth() + 1 <= 12) {
        return [3];
    }
    else if (start_month.getMonth() + 1 >= 1 && end_month.getMonth() + 1 <= 8) {
        return [1, 2];
    }

    else if (start_month.getMonth() + 1 >= 5 && end_month.getMonth() + 1 <= 12) {
        return [2, 3];
    }
    else if (start_month.getMonth() + 1 >= 1 && end_month.getMonth() + 1 <= 12) {
        return [1, 2, 3]
    }
    throw new Error('There is no trimester between the chosen dates')
}


// We use async on this function because we need data for all trimesters to be gathered before doing
// anything else
const cp_subscription_level = async ()  => {

    function createPlots(api_data) {
        Chart.defaults.global.legend.display = false;
        document.getElementById("cp_sl").innerHTML = '&nbsp;';
        document.getElementById("cp_sl").innerHTML = '<canvas id="fourth" style="height: 300px"></canvas>';

        let mychart = document.getElementById("fourth").getContext("2d");
        let chart = new Chart(mychart, {
            type: "bar",
            data: {
                labels: [
                    "1.0-m",
                    "1.9-m"
                ],
                datasets: [
                    {
                        label: "Subscription level",
                        data: api_data,
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
                        { scaleLabel:{display:true, labelString:'PERCENTAGE', fontColor:'black', fontSize:15},
                            ticks: {
                                beginAtZero: true,
                                fontColor: 'black',
                                fontSize:15,
                                callback: function (value) {
                                    return value + '%';
                                }
                            }
                        }
                    ],
                    xAxes:[{scaleLabel:{display: true, labelString: 'Telescopes', fontColor:'black', fontSize:15},
                        barPercentage:0.4,
                        ticks: {
                            fontColor: 'black',
                            fontSize:15
                        }
                    }]
                },
                responsive: false
            }
        });
        const isAllZero = api_data.every(item => item === 0)
        if (isAllZero ===  true){
            document.getElementById('no-data-sl').style.display = 'block';
            document.getElementById('cp_sl').style.display = 'none'
        }
        else {
            document.getElementById("no-data-sl").style.display = 'none'
        }
        chart.data.datasets[0].data = api_data;
        chart.update();
    }

    let   date_picker_one_value = document.getElementById("datePicker").value;
    let   date_picker_two_value = document.getElementById("datePicker2").value;

    let converted_start_date = moment(date_picker_one_value);
    let converted_end_date = moment(date_picker_two_value);

    let start_date = new Date(converted_start_date);
    let end_date = new Date(converted_end_date);

    let difference_in_years = end_date.getFullYear()-start_date.getFullYear();

    let all_trimesters_in_chosen_years = [];

    for ( let i=0; i <= difference_in_years; i++){

        let start_month = i === 0 ? start_date : new Date('2020/01/04');
        let end_month = i === difference_in_years ? end_date : new Date('2020/12/04');
        all_trimesters_in_chosen_years.push({
            year: start_date.getFullYear() + i,
            trimesters: get_trimesters(start_month, end_month)
        })
    }

    // variables to store the api calls
    let url_one_meter = "";
    let url_one_point_nine_meter = "";
    // let url_irsf = "";

    // variables to store the subscription level for each telescope per trimester
    let subscription_level_one_meter = 0;
    let subscription_level_one_point_nine_meter = 0;

    // array to hold the subscription level for each telescope
    let plotting_data_array =[];

    // We check that your chosen start date is less than your end date and the datepickers are not empty
    if (converted_start_date < converted_end_date && (converted_start_date!=='' && converted_end_date!=='')) {

        const promises = [];

        all_trimesters_in_chosen_years.forEach(element=>{
            let  my_trimesters = element.trimesters;
            my_trimesters.forEach(trimester => {
                url_one_meter = d3.json(`/subscription_level?year=${element.year}&trimester=${trimester}&telescope=1.0-m`) ;
                url_one_point_nine_meter = d3.json(`/subscription_level?year=${element.year}&trimester=${trimester}&telescope=1.9-m`);
                promises.push(url_one_meter, url_one_point_nine_meter);
            })
        });

        await Promise.all(promises).then(my_data => {
            my_data.forEach(telescope_data => {
                telescope_data.subscription_level.forEach(value => {
                    if (value.telescope_name === '1.9-m') {
                        subscription_level_one_meter += value.subscription;
                    }
                    if (value.telescope_name === '1.0-m') {
                        subscription_level_one_point_nine_meter += value.subscription;
                    }
                });
            });
        });
        plotting_data_array.push(subscription_level_one_meter, subscription_level_one_point_nine_meter);
        createPlots(plotting_data_array)
    }
};
