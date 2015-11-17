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

function sherdogImage(fighter, callback){
    
    if(!fighter.img){
        var sherdogUrl = "http://www.sherdog.com/stats/fightfinder?SearchTxt="+fighter.name.split(' ').join('+');
        request(sherdogUrl, function(error, response, html){
            var $ = cheerio.load(html);
            if (!error && response.statusCode == 200){
                var span = $('span:contains("Fighter Results List")', html);
                if(span){
                    $('.fightfinder_result tr:not(".table_head")').each(function(i, val){
                        var tds = $(val).find('td');
                        var nameLink = tds.eq(1).find('a')
                        var nickname = tds.eq(2);
                        if(fighter.name == nameLink.text() && '"'+fighter.nickname+'"' == nickname){
                            var sherdogFighterUrl = "http://www.sherdog.com"+$(nameLink).attr('href');
                            request(sherdogFighterUrl, function(error, response, html){
                                if(!error && response.statusCode == 200){
                                    console.log('wtf mate');
                                    fighter.img = $('img .profile_image',html);
                                    callback(fighter)

                                }
                                else{callback(fighter)}
                            })
                        }
                        else{callback(fighter)}
                    })
                }
                else{callback(fighter)}
                
            }
            else{callback(fighter)}
        
        });
    }
    else{callback(fighter);}
    
    
}

function fighter(url_end, secondary_serach, callback){
    url = historyUrl(url_end);
    request(url, function(error, response, html){
    	if (!error && response.statusCode == 200) {
    	    var $ = cheerio.load(html);
    	    isWin = function(tr){return $(tr).find('td').eq(3).text()=='Win';}
    	    var fighter = { 
                 name: "",
    			 nickname: "",
    			 wins : [],
    			 id: "",
			    img: "",
            };
            image = $(".main-headshot img").attr("src");
            fighter.id = getID(url);
            fighter.name = $('.mod-content h1').html();
            fighter.nickname = $(".player-metadata li:contains('Nickname')").contents().eq(1).text();
            $('.evenrow, .oddrow').each(function(i, val){
                if(isWin($(val))){
                    fighter.wins.push(parseWin($(val)));
                }
            });  
            secondary_serach(fighter, callback);
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
	});

}


fighter("http://espn.go.com/mma/fighter/history/_/id/2335639/jon-jones", sherdogImage, function(fighter){console.log(fighter);});
