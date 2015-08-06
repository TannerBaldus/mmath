var request = require("request");
var cheerio = require("cheerio");

function getUrls(){
    getUrl = function(val, i){return $(val).attr('href')};
    return $.map(('.evenrow a, .oddrow a'), getUrl);
}

function getID(url){
    idIndex = url.indexOf("_/id");
    return url.slice(idIndex+5, idIndex+12);
}


function parseWin(tr){
    win = { opponentId:"",
	    opponentName: "",
	    method:""
	  };
    opponentEl = tr.find('td a').eq(1);
    win.opponentId = getID(opponentEl.attr('href'));
    win.opponentName = opponentEl.text().trim();
    win.method = tr.find('td').eq(4).text();
    return win;
    }


function historyUrl(url){
    return "http://espn.go.com/mma/fighter/history/_/id/"+getID(url);
}

function fighter(url_end, callback){
    url = historyUrl(url_end);
    request(url, function(error, response, html){
    	if (!error && response.statusCode == 200) {
    	    var $ = cheerio.load(html);
    	    isWin = function(tr){return $(tr).find('td').eq(3).text()=='Win';}
    	    var fighter = { name: "",
    			    nickname: "",
    			    wins : [],
    			    id: "",
			    img: "",
    		};
	    image = $(".main-headshot img").attr("src");
	    if(!image)
		;
    	    fighter.id = getID(url);
    	    fighter.name = $('.mod-content h1').html();
    	    fighter.nickname = $(".player-metadata li:contains('Nickname')").contents().eq(1).text();
    	    $('.evenrow, .oddrow').each(function(i, val){
		if(isWin($(val))){
		    console.log('foo');
		    fighter.wins.push(parseWin($(val)));
		}
	    });
    	    callback(fighter);
    	}

    });
}

function get_fighters(fighter, callback){
    url = "http://espn.go.com/mma/fighters";
    request(url, function(error, response, html){
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
	    $('.evenrow a, .oddrow a').each(function(i, val){
		fighter($(val).attr('href'));});
	   }
	}

}


fighter("http://espn.go.com/mma/fighter/history/_/id/2335639/jon-jones", function(fighter){console.log(fighter);});
