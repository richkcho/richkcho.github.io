//region Initialization
initMap();

// draw radar with toy data
RadarChart.draw("#radar-chart-container", toy_data);

// set up trigger for enter key
$("#summoner_name").keyup(function(event){
    if(event.keyCode == 13){
        $("#btnRenderMap").click();
    }
});
//endregion

initHeatMap();
// eventually this will be on a button
// console.log(getEventData(19738326));