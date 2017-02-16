var jsonfile = require('jsonfile');
var cheerio = require('cheerio');
var config = require('../config')
var requestp = require('request-promise');

/**
* Using the rest api gets a json string of all nodes in the db
* @return {string}  an Array instance with the contents shuffled.
*/
function getNeo4jJson(){
  var headers = {
      'accept': 'application/json',
      'content-type': 'application/json',
      'Authorization': "Basic " + new Buffer(config.db.username + ":" + config.db.password).toString("base64")
  };

  var dataString = '{"statements":[{"statement":"MATCH (n) RETURN (n)"}]}';

  var options = {
      url: 'http://localhost:7474/db/data/transaction/commit',
      method: 'POST',
      headers: headers,
      body: dataString
  };
  return requestp(options);
}


function addTokenList(token, fighterObj, collectionObj){
  if(!collectionObj[token]){
    collectionObj[token.toLowerCase()] = [];
  }
  collectionObj[token.toLowerCase()].push(fighterObj);
}

/**
* Using the rest api gets a json string of all nodes in the db
* @return {string}  an Array instance witht the contents shuffled.
*/
function formatNeo4jResponse(neo4jResponse){
  var formattedObj= {};
  var r= JSON.parse(neo4jResponse);
  r.results[0].data.forEach(i => {
    fighterObj = i.row[0];
    console.log(fighterObj);
    if(fighterObj.name){
      addTokenList(fighterObj.name, fighterObj, formattedObj);
      addTokenList(fighterObj.name.split(' ').slice(-1)[0], fighterObj, formattedObj);
    }
    if(fighterObj.nickname){
        addTokenList(fighterObj.nickname.replace('The ',''), fighterObj, formattedObj);
    }

  });
  return  formattedObj;
}

/**
* Creates an object of ufc fighter by filtering an array object of all Fighters in
* the db against the wikipedia page of current ufc fighters.
* @param {Array} allFighters an Array of fighter objects form [name:{fighterID, name, nickname, img},..]
* @return {Array} an Array of fighter objects [{fighterID, name, nickname, img},..]
*/
function getUFCRoster(allFighters){
  return requestp('https://en.wikipedia.org/wiki/List_of_current_UFC_fighters?oldformat=true')
  .then(function(body){
    var $ = cheerio.load(body);
    var wikitables = $('.wikitable').slice(2);
    var ufcArr = [];

    wikitables.find('span.fn').each((i,v) => {
        var fighterName = $(v).text().toLowerCase();
        var fighterObjs = allFighters[fighterName];
        // Sometimes the wiki fighter name doesn't match the espn name
        // e.g. Seohee Ham vs Se Seo hee ham
        if(fighterObjs){
          ufcArr.push(fighterObjs);
        }
    });
    return [].concat.apply([], ufcArr);
  });
}


function main(){
  getNeo4jJson()
  .then(neo4jResponse => formatNeo4jResponse(neo4jResponse))
  .then(formattedObj => {
    jsonfile.writeFile( 'routes/allFighters.json', formattedObj, e =>{ if(e){console.error(e);}});
    return formattedObj;
  })
  .then(allFighters => getUFCRoster(allFighters))
  .then(ufcArr => jsonfile.writeFile('public/ufcFighters.json', ufcArr, e => {if(e){console.error(e);}}))
  .catch(err => console.error(err+err.stack));
}

module.exports = {
  getNeo4jJson: getNeo4jJson,
  formatNeo4jResponse: formatNeo4jResponse
};

if (require.main === module) {
    main();
}
