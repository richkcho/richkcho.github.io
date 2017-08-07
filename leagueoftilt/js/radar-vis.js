/**
 * Created by Richard on 4/18/2016.
 */

function renderRadarOutput() {
    if(!playerInfoLoaded()) {
        return null;
    }

    var s1 = lookupPlayerID($("#test_1").val());
    var s2 = lookupPlayerID($("#test_2").val());
    var s3 = lookupPlayerID($("#test_3").val());

    var players = [s1, s2, s3];

    // code below here shouldn't really change, just change how the players array is made
    drawRadarChartPlayers(players, "ANY", "ANY", "#radar-chart-container");
}

function drawRadarChartPlayers(players, lane, role, div) {
    var radarq = d3_queue.queue();
    players.forEach(function(elem, index, arr) {
        if(elem != null) {
            radarq.defer(loadPlayerStats, elem);
        }
    });
    radarq.awaitAll(function(error, players) {
        return drawRadarChart(error, players, lane, role, div);
    });
}

function drawRadarChart(error, players, lane, role, div) {
    if(error) {
        throw error;
    }

    // TODO decide on how to handle no good data
    if(players.length == 0) {
        return null;
    }

    var radardata = [];
    players.forEach(function(playerdata, index, arr) {
        radardata.push(convertStatsToRadarData(lookupPlayerName(playerdata["SummonerID"]),
                                calculatePlayerAverages(playerdata["Stats"]), lane, role));
    });

    // consider drawing the average here
    radardata.push(convertStatsToRadarData("Average", getGlobalAverages(lane, role), lane, role));

    RadarChart.draw(div, radardata);
}

function convertStatsToRadarData(name, stats, lane, role) {
    var tempdata = {};
    tempdata.className = name;
    var axes = [];
    var normedstats = normalizeAverageStats(stats, lane, role);
    util.statfields.forEach(function(key, index, arr) {
        axes.push({axis: keyToString(key), value: normedstats[key] + 1, rawvalue: stats[key]}); // thus a value of 1 be normal
    });
    tempdata.axes = axes;

    return tempdata;
}