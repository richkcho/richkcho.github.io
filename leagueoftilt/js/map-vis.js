/**
 * Created by Richard on 4/14/2016.
 */

var map = {};
map.scale = {};

function renderMapOutputTimeRegion() {
    if(!map.initialized || !playerInfoLoaded()) {
        // wait until stuff has loaded TODO error handling
        console.log("Map not loaded yet!");
        return;
    }

    var summonerID = lookupPlayerID($("#summoner_name").val());
    if(summonerID == null) {
        // invalid player TODO error handling
        console.log("Invalid player chosen!");
        return;
    }

    var lane = "ANY";
    var role = "ANY";
    switch($("#role_selected").val()) {
        case "top":
            lane = "TOP";
            role = "SOLO";
            break;
        case "jg":
            lane = "JUNGLE";
            role = "NONE";
            break;
        case "mid":
            lane = "MIDDLE";
            role = "SOLO";
            break;
        case "adc":
            lane = "BOTTOM";
            role = "DUO_CARRY";
            break;
        case "sup":
            lane = "BOTTOM";
            role = "DUO_SUPPORT";
            break;
    }

    // get the time info from the slider position
    timestart = $(map.slider.divId).slider("values", 0);
    timeend = $(map.slider.divId).slider("values", 1);

    // set player name
    $("#summoner_name").val(lookupPlayerName(summonerID));

    // start animation
    animateMapTimeRegion(summonerID, lane, role, timestart, timeend);

    // create radar map for this person
    drawRadarChartPlayers([summonerID], lane, role, "#map-radar-container");
}

function renderMapOutputTimeAll() {
    if(!map.initialized || !playerInfoLoaded()) {
        // wait until stuff has loaded TODO error handling
        console.log("Map not loaded yet!");
        return;
    }

    var summonerID = lookupPlayerID($("#summoner_name").val());
    if(summonerID == null) {
        // invalid player TODO error handling
        console.log("Invalid player chosen!");
        return;
    }

    var lane = "ANY";
    var role = "ANY";
    switch($("#role_selected").val()) {
        case "any":
            break;
        case "top":
            lane = "TOP";
            role = "SOLO";
            break;
        case "jg":
            lane = "JUNGLE";
            role = "NONE";
            break;
        case "mid":
            lane = "MIDDLE";
            role = "SOLO";
            break;
        case "adc":
            lane = "BOTTOM";
            role = "DUO_CARRY";
            break;
        case "sup":
            lane = "BOTTOM";
            role = "DUO_SUPPORT";
            break;
    }

    // set player name
    $("#summoner_name").val(lookupPlayerName(summonerID));

    // start animation
    animateMapTimeAll(summonerID, lane, role);

    // create radar map for this person
    drawRadarChartPlayers([summonerID], lane, role, "#map-radar-container");
}

function initMap() {
    // Domain for the current Summoner's Rift on the in-game mini-map
    map.scale.domain = {
        min: {x: -570, y: -420},
        max: {x: 15220, y: 14980}
    };

    // svg map settings
    map.width = 500;
    map.height = 500;

    map.scale.xScale = d3.scale.linear()
        .domain([ map.scale.domain.min.x,  map.scale.domain.max.x])
        .range([0, map.width]);

    map.scale.yScale = d3.scale.linear()
        .domain([ map.scale.domain.min.y,  map.scale.domain.max.y])
        .range([map.height, 0]);

    map.svg = d3.select("#map-container").append("svg:svg")
        .attr("width", map.width)
        .attr("height", map.height);

    map.bg = map.svg.append('image')
        .attr('xlink:href', "img/map.png")
        .attr('x', '0')
        .attr('y', '0')
        .attr('width', map.width)
        .attr('height', map.height);

    //document.getElementById("map-slider-div").innerHTML +=
    //    "<input id='map-slider' type='range' step=1 min=0 /> ";

    map.slider = {};
    map.slider.textboxId = "#map-slider-time";
    map.slider.divId = "#map-slider-div";

    $(map.slider.divId).slider({
        range: true,
        min: 0,
        max: 60,
        values: [ 0, 60 ],
        slide: function( event, ui ) {
            $(map.slider.textboxId).val( "" + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        }
    });
    $(map.slider.textboxId).val( "" + $(map.slider.divId).slider( "values", 0 ) +
        " - " + $(map.slider.divId).slider( "values", 1 ) );

    map.initialized = true;
    console.log("Initialized map");
}

function animateMapTimeRegion(playerID, playerLane, playerRole, timeStart, timeEnd) {
    d3.json("data/mapdata/" + playerID + ".json", function(error, mapdata) {
        // clear old stuff in svg
        map.svg.selectAll("circle").remove();
        map.svg.selectAll("path").remove();

        // filter mapdata by role and lane
        mapdata = filterData(mapdata, playerLane, playerRole);

        var color = d3.scale.category20();
        color.domain(
            Array.apply(null, Array(mapdata.length))
                .map(function (_, i) {
                    return i
                }));

        for(var i = 0; i < mapdata.length; ++i) {
            var points = mapdata[i].Frames;

            points = points.filter(function(d, i, arr) {
                return (timeStart == "START" || timeStart <= i) &&
                    (timeEnd == "END" || i <= timeEnd);
            });

            if(points.length > 0) {

                points.forEach(function (d, i, points) {
                    points[i] = [map.scale.xScale(d[0]), map.scale.yScale(d[1])]
                });

                var path = map.svg.append("path")
                    .data([points])
                    .attr("d", d3.svg.line()
                        .tension(0) // Catmull–Rom
                        .interpolate("linear"));

                var circle = map.svg.append("circle")
                    .attr("r", 5)
                    .attr("fill", color(i))
                    .attr("transform", "translate(" + points[0] + ")");

                transition(circle, path);
            } else {
                // handle this case TODO show message saying no games found
            }

        }

    });
}

function animateMapTimeAll(playerID, playerLane, playerRole) {
    animateMapTimeRegion(playerID, playerLane, playerRole, "START", "END");
}

// Returns an attrTween for translating along the specified path element.
function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
        return function(t) {
            var p = path.getPointAtLength(t * l);
            return "translate(" + p.x + "," + p.y + ")";
        };
    };
}

function transition(circle, path) {
    if(circle && path) {
        circle.transition()
            .duration(1000 * path[0][0]["__data__"].length)
            // duration should be proportional to in-game time
            .ease("linear")
            .attrTween("transform", translateAlong(path.node()))
            .each("end", transition);
        // TODO talk about this, might not be the best place to put.
        //$("#map-slider-div").slider("option", "max", path[0][0]["__data__"].length);
        //$("#map-slider-div").slider("value", $("#map-slider-div").slider("value"));

    }

}