var request = require("request");
var cheerio = require("cheerio");
var moment = require('moment');
var neo4j = require('neo4j-driver').v1;
var UUID = require('uuid-js');
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));
var session = driver.session();

moment.locale('us');

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function getID(url){
    idIndex = url.indexOf("_/id");
    return url.slice(idIndex+5, idIndex+12);
}


function parseWin(winnerID, tr){
    win = {
        date: "",
        loserID:"",
        loserName: "",
        method:"",
        winnerID:winnerID
	 };
    win.date = moment(tr.find('td').eq(0).text(), 'MMM, DD YYY').toISOString();
    loserEl = tr.find('td a').eq(1);
    win.loserID = getID(loserEl.attr('href'));
    win.loserName = loserEl.text().trim();
    win.method = tr.find('td').eq(4).text();
    if(!win.loserID){
        win.loserID = UUID.create().toString();
    }
    return win;
    }

function historyUrl(url){
    return "http://espn.go.com/mma/fighter/history/_/id/"+getID(url);
}

function winToDB(win){
    query = [
        "MATCH (winner:Fighter {fighterID: {winnerID} })",
        "MERGE (loser:Fighter {fighterID: {loserID}, name: {loserName} })",
        "MERGE (winner)-[b:Beat {method: {method}, date: {date} }]->(loser)",
        "RETURN winner.fighterID,b.method,loser.fighterID"
    ].join('\n');
    queryPromise = session.run(query, win);
    queryPromise.then(function (result) {
        result.records.forEach(function(record) {
            console.log(record);
        });
    })
    .catch(function (val) {
        console.log(val);
    });
}

function  fighterToDB(fighter){
    console.log("fighterToDB");
    var p1 = new Promise(function(resolve, reject){
        var query = [
            "MERGE (f:Fighter {fighterID: {fighterID} })",
            "SET f += {props}",
            "RETURN f"
        ].join('\n');
        console.log(query, fighter);
        var queryPromise = session.run(query, fighter);
        queryPromise.then(
            function(val){
                console.log(val);
                fighter.wins.forEach(function(win){
                    winToDB(win);
                    resolve(fighter);
                });
            }
        )
        .catch(
            function(err){
                console.log(err);
                reject(err);
            }
        );
    });
    return p1;
}


function fighter(url_end){
    var p1 = new Promise(function(resolve, reject){
        url = historyUrl(url_end);
        request(url, function(error, response, html){
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                isWin = function(tr){return $(tr).find('td').eq(3).text()=='Win';};
                var fighter = {
                    fighterID: "",
                     props:{
                         name: "",
                         nickname: "",
                         img: ""
                     },
                    wins: []
                };
                fighter.fighterID = getID(url);
                fighter.props.name = $('.mod-content h1').html();
                fighter.props.img = $(".main-headshot img").attr("src");
                fighter.props.nickname = $(".player-metadata li:contains('Nickname')").contents().eq(1).text();
                $('.evenrow, .oddrow').each(function(i, val){
                    if(isWin($(val))){
                        fighter.wins.push(parseWin(fighter.fighterID, $(val)));
                    }
                });
                resolve(fighter);
            }
            else {
                reject(error);
            }
        });
    });
    return p1;
}


function get_fighters(fighter, callback){
    url = "http://espn.go.com/mma/fighters";
    request(url, function(error, response, html){
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
	    $('.evenrow a, .oddrow a').each(function(i, val){
		fighter($(val).attr('href'));});
	   }
	});

}


var fp = fighter("http://espn.go.com/mma/fighter/history/_/id/2335639/jon-jones");
fp.then(
    function(fighter){
        console.log(fighter);
        fighterToDB(fighter);
    }
)
.catch(
    function(val){console.log(val);}
);
