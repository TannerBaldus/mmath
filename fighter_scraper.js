var request = require("request");
var cheerio = require("cheerio");
var neo4j = require('neo4j-driver').v1;
var UUID = require('uuid-js');
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));
var session = driver.session();

function getUrls(){
    getUrl = function(val, i){return $(val).attr('href');};
    return $.map(('.evenrow a, .oddrow a'), getUrl);
}

function getID(url){
    idIndex = url.indexOf("_/id");
    return url.slice(idIndex+5, idIndex+12);
}


function parseWin(winnerID, tr){
    win = { loserID:"",
	       loserName: "",
	       method:"",
           winnerID:winnerID
	 };
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

function fighter(url_end){
    var p1 = new Promise(function(resolve, reject){
        url = historyUrl(url_end);
        request(url, function(error, response, html){
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                isWin = function(tr){return $(tr).find('td').eq(3).text()=='Win';};
                var fighter = {
                     name: "",
                     nickname: "",
                     wins : [],
                     id: "",
                     img: "",
                };
                fighter.id = getID(url);
                fighter.name = $('.mod-content h1').html();
                fighter.img = $(".main-headshot img").attr("src");
                fighter.nickname = $(".player-metadata li:contains('Nickname')").contents().eq(1).text();
                $('.evenrow, .oddrow').each(function(i, val){
                    if(isWin($(val))){
                        fighter.wins.push(parseWin($(val)));
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
    function(val){console.log(val);}
)
.catch(
    function(val){console.log(val);}
)
