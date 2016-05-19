"use strict";
var requestp = require("request-promise");
var cheerio = require("cheerio");
var crypto = require('crypto')
var moment = require('moment');
var neo4j = require('neo4j-driver').v1;
var UUID = require('uuid-js');
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));
var session = driver.session();



moment.locale('us');


 /**
 * Shuffles an array using the Durstenfeld shuffle algorithm. Used for
 * opening urls in a random order as not to get blocked
 * @param {array} an Array instance
 * @return {boolean}  an Array instance witht the contents shuffled.
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


/**
* From an espn url gets the id for the fighter
* @param {string} url the url to get the ID from
* @return {string}  the ID from the URL of the fighter
*/
function getID(url){
    var idIndex = url.indexOf("_/id");
    return url.slice(idIndex+5, idIndex+12);
}


/**
 * @typedef Win
 * @type Object
 * @property {string} date the date of the win
 * @property {string} loserID the ID of the losing fighter
 * @property {string} loserName the name of the losing fighter
 * @property {string} method the method of victory e.g. KO, TKO
 * @property {string} winnerID the ID of the winning fighter
 */


/**
* Constructs a Win object from a table row and winnerID
* @param {string} winnerID the ID of the winning fighter
* @param {Object} tr a cheerio tr object
* @return {Win} the parsed win object
*/
function parseWin(winnerID, tr){
    var win = {
        date: "",
        loserID:"",
        loserName: "",
        method:"",
        winnerID:winnerID
	 };
    win.date = moment(tr.find('td').eq(0).text(), 'MMM, DD YYY').toISOString();
    var loserEl = tr.find('td a').eq(1);
    win.loserName = loserEl.text().trim();
    win.loserID = loserEl ? getID(loserEl.attr('href')) : crypto.createHash('md5').update(win.loserName).digest('hex');
    win.method = tr.find('td').eq(4).text();
    return win;
    }

/**
* Gets the full fight history url from another url
* @param {string} url an espn url to a fighter
* @return {string} the full fight history page of the fighter
*/
function historyUrl(url){
    return "http://espn.go.com/mma/fighter/history/_/id/"+getID(url);
}


/**
* Saves a Win object into the neo4j databsse
* @param {Win} win a Win object
* @return {Promise} a promise that resolves on succesful query
*/
function winToDB(win){
    var query = [
        "MATCH (winner:Fighter {fighterID: {winnerID} })",
        "MERGE (loser:Fighter {fighterID: {loserID}, name: {loserName} })",
        "MERGE (winner)-[b:Beat {method: {method}, date: {date} }]->(loser)",
        "RETURN winner.fighterID,b.method,loser.fighterID"
    ].join('\n');
    var queryPromise = session.run(query, win);
    return queryPromise.then(function (result) {
        console.log('Successfully saved win');
        Promise.resolve('Success');
    })
    .catch(function (val) {
        console.error(val);
        Promise.reject('Failure');
    });
}



/**
* Saves a Win object into the neo4j databsse
* @param {Win} win a Win object
* @return {Promise} a promise that resolves on succesful query
*/
function  fighterToDB(fighter){
    var p1 = new Promise(function(resolve, reject){
        var query = [
            "MERGE (f:Fighter {fighterID: {fighterID} })",
            "SET f += {props}",
            "RETURN f"
        ].join('\n');
        var queryPromise = session.run(query, fighter);
        queryPromise.then(
            function(val){
                console.log("Success Saved Fighter");
                fighter.wins.forEach(function(win){
                    winToDB(win);
                    resolve(fighter);
                });
            }
        )
        .catch(
            function(err){
                console.error(err);
                reject(err);
            }
        );
    });
    return p1;
}

function isWin(tr){
    return tr.find('td').eq(3).text()=='Win';
}

function parseFighter(urlEnd){
    var options ={
        url:historyUrl(urlEnd),
        headers: {
            'User-Agent': 'AppleWebKit/537.36 (KHTML, like Gecko)'
        },
    }
    return requestp(options).then(
        function(body){
            var $ = cheerio.load(body);
            var fighter = {
                fighterID: getID(urlEnd),
                 props:{
                     name: $('.mod-content h1').html() ||  '',
                     nickname: $(".player-metadata li:contains('Nickname')").contents().eq(1).text() ||  '',
                     img: $(".main-headshot img").attr("src") ||  ''
                 },
                wins: []
            };
            $('.evenrow, .oddrow').each( function(i,val){
                if(isWin($(val))){
                    fighter.wins.push(parseWin(fighter.fighterID, $(val)));
                }
            });
            console.log("FIGHTER ID "+fighter.fighterID);
            return  fighter;
        }
    );
}


function getFighter(url){
    return parseFighter(url).then(
        function(fighter){
            return fighterToDB(fighter);
        }
    );
}

function parseListPage(letter){
    console.log(letter);
    var url = "http://espn.go.com/mma/fighters?search="+letter;
    var urlsPromise = requestp(url).then(function(body){
        var $ = cheerio.load(body);
        var urls = [];
        var getUrl = function(val){return $(val).attr('href');};
        $('.evenrow a, .oddrow a').each(function(i, val){
            urls.push(getUrl(val));
        });

        return urls;
    });
    return urlsPromise;
}


function main(){
    parseListPage(process.argv[2]).then(
        function(results){
            var urls = [].concat.apply([], results);
            return shuffleArray(urls);
        }).then(
            function(urls){
                return urls.forEach((url, i) =>getFighter(url));
        }).catch(function(err){
            console.error(err);
            console.error(err.stack);
        });
}

module.exports = {
    parseFighter: parseFighter,
    parseListPage: parseListPage,
    fighterToDB: fighterToDB,
    getFighter: getFighter
};

if (require.main === module) {
    main();
}
