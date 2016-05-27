var config = require('../config')
var express = require('express');
var jsonfile = require('jsonfile');
var Autocomplete = require('autocomplete');
var url = require('url');
var autocomplete = Autocomplete.connectAutocomplete();
var allFighters = jsonfile.readFileSync('public/allFighters.json');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver(config.db.url, neo4j.auth.basic("neo4j", "neo4j"));


autocomplete.initialize(function(onReady) {
    onReady(Object.keys(allFighters));
});

var router = express.Router();


/**
* Removes duplicate fighter objects from and array of fighter objects.
* We do this because since we mapped multiple tokens to the same fighter,
* there might be the same fighter obj in the search results
* @param {array} an Array instance of fighter objects
* @return {boolean}  an Array instance of fighter objects with no duplicates.
*/
function dedupFighters(fighterList){
    var dedupedArr = [];
    var seenIDs = {};
    fighterList.forEach(el=>{
        if(!seenIDs[el.fighterID]){
            dedupedArr.push(el);
            seenIDs[el.fighterID] = true;
        }
    });
    return dedupedArr;
}

/**
* Uses a trie to find fighters that might autocomplete from the query.
* Sends an array of fighter objects as a response.
* @param {req} a Reqest object
* @param {res} a Response object
* @return
*/
router.get('/fighters/search*', function (req, res, next){
    var searchQuery = req.query.q.toLowerCase();
    var searchResults  = autocomplete.search(searchQuery);
    console.log(searchResults);
    var fighterObjs = dedupFighters([].concat.apply([], searchResults.map(i => allFighters[i])));
    res.send(fighterObjs);
});


/**
* Formats a Neo4j query to an easier to digest object
* @param {record} a Neo4j record
* @return {Obj} and Object of the form {returnFieldName:returnFieldValue}
*/
function formatQueryReord(record){
  var formattedObj = {};
  record.keys.forEach(key=> {
    console.log(key);
    formattedObj[key] = record._fields[record._fieldLookup[key]];});
  return formattedObj;
}

/**
* Queries the Neo4j DB for a win path between the fighters with the winnerID
* and loserID.
* @param {winnerID} a String of the winning fighter ID
* @param {loserID} a String of the losing fighter ID
* @return {Obj} and Object of the form {winner:nodeObj, loser:nodeObj, path:pathObj}
*/
function getPath(winnerID, loserID){
  var session = driver.session();
  var query = [
    'match (winner:Fighter {fighterID:{winnerID} })',
    'match (loser:Fighter {fighterID:{loserID}})',
    'optional match path=shortestPath((winner)-[:Beat*..100]->(loser))',
    'return winner, loser, path'
  ].join('\n');
  var queryPromise = session.run(query, {winnerID:winnerID, loserID:loserID});
  return queryPromise.then( result => {
    session.close();
    return formatQueryReord(result.records[0]);
  });
}

/**
* Queries the Neo4j DB from the winnerID and loserID from the req obj
* and sends the formatted path obj as a response.
* @param {req} a Reqest object
* @param {res} a Response object
* @return
*/
router.get('/paths*', function(req, res, next){
    var winnerID = req.query.winnerID;
    var loserID = req.query.loserID;
    getPath(winnerID, loserID).then( path =>{
      res.send(path);
    })
    .catch(err => console.log(err));
});



module.exports = router;
