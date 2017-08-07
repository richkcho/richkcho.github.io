/**
 * Created by Alex on 4/24/2016
 */

var heatmap = {};
heatmap.scale = {};

function initHeatMap() {
	// Domain for the current Summoner's Rift on the in-game mini-map
    heatmap.scale.domain = {
        min: {x: -570, y: -420},
        max: {x: 15220, y: 14980}
    };

    heatmap.colors = {};
    heatmap.colors.kill = "#64ed32";
    heatmap.colors.death = "red";

    // svg map settings
    heatmap.width = 500;
    heatmap.height = 500;

    heatmap.gridDenom = 50;

    // may have to change if we make the map not square
    heatmap.gridSize = Math.floor(heatmap.width / heatmap.gridDenom);

    heatmap.scale.xScale = d3.scale.linear()
    	.domain([heatmap.scale.domain.min.x, heatmap.scale.domain.max.x])
    	.range([0, heatmap.width]);

    heatmap.scale.yScale = d3.scale.linear()
    	.domain([heatmap.scale.domain.min.y, heatmap.scale.domain.max.y])
    	.range([heatmap.height, 0]);

    heatmap.svg = d3.select("#heatmap-container").append("svg:svg")
    	.attr("width", heatmap.width)
    	.attr("height", heatmap.width);

    heatmap.bg = heatmap.svg.append('image')
    	.attr('xlink:href', 'img/map.png')
    	.attr('x', '0')
    	.attr('y', '0')
    	.attr('width', heatmap.width)
    	.attr('height', heatmap.height);

    heatmap.slider = {};
    heatmap.slider.textboxId = "#heatmap-slider-time";
    heatmap.slider.divId = "#heatmap-slider-div";

    $(heatmap.slider.divId).slider({
        range: true,
        min: 0,
        max: 60,
        values: [ 0, 60 ],
        slide: function( event, ui ) {
            $(heatmap.slider.textboxId).val( "" + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        }
    });
    $(heatmap.slider.textboxId).val( "" + $(heatmap.slider.divId).slider( "values", 0 ) +
        " - " + $(heatmap.slider.divId).slider( "values", 1 ) );


    heatmap.initialized = true;
    console.log('heatmap initialized');
}

function renderHeatmapOutputTimeRegion() {
    if(!heatmap.initialized || !playerInfoLoaded()) {
        // wait until stuff has loaded TODO error handling
        console.log("Heatmap not loaded yet!");
        return;
    }

    var summonerID = lookupPlayerID($("#summoner_name_heatmap").val());
    if(summonerID == null) {
        // invalid player TODO error handling
        console.log("Invalid player chosen!");
        return;
    }

    var lane = "ANY";
    var role = "ANY";
    switch($("#role_selected_heatmap").val()) {
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

    // get the time info from the slider position
    timestart = $(heatmap.slider.divId).slider("values", 0);
    timeend = $(heatmap.slider.divId).slider("values", 1);

    // set player name
    $("#summoner_name_heatmap").val(lookupPlayerName(summonerID));

    createHeatmapTimeRegion(summonerID, lane, role, timestart, timeend);
}

function renderHeatMapOutputTimeAll() {
     if(!heatmap.initialized || !playerInfoLoaded()) {
	        // wait until stuff has loaded TODO error handling
	        console.log("Heatmap not loaded yet!");
	        return;
     }

    var summonerID = lookupPlayerID($("#summoner_name_heatmap").val());
    if(summonerID == null) {
        // invalid player TODO error handling
        console.log("Invalid player chosen!");
        return;
    }

    var lane = "ANY";
    var role = "ANY";
    switch($("#role_selected_heatmap").val()) {
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
    $("#summoner_name_heatmap").val(lookupPlayerName(summonerID));

	createHeatmapTimeAll(summonerID, lane, role);
}

function createHeatmapTimeRegion(playerID, playerLane, playerRole, timeStart, timeEnd) {
	d3.json("data/eventdata/" + playerID + ".json", function(error, mapdata) {
		// clear old stuff in svg
		heatmap.svg.selectAll("circle").remove();

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

				// scale the points
				points.forEach(function (e, ei, earr) {
                    if(e.length > 0) {
                        e.forEach(function(d, di, darr) {
                            heatmap.svg.append("circle")
                                .attr("r", 5)
                                .attr("fill", (d["Type"] == "Kill" ? heatmap.colors.kill : heatmap.colors.death))
                                .attr("class", "heatmap")
                                .attr("fill-opacity", "0.5")
                                .attr("transform", "translate(" + [heatmap.scale.xScale(d["Location"][0]), heatmap.scale.yScale(d["Location"][1])] + ")");
                        });
                    }
				});

			} else {
				// handle this case TODO show message saying no games found
			}

		}

	});
}

function createHeatmapTimeAll(playerID, playerLane, playerRole) {
	createHeatmapTimeRegion(playerID, playerLane, playerRole, "START", "END");
}