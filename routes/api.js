var express = require('express');
var jsonfile = require('jsonfile');
var Autocomplete = require('autocomplete');
var url = require('url');
var autocomplete = Autocomplete.connectAutocomplete();
var allFighters = jsonfile.readFileSync('public/allFighters.json');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));


autocomplete.initialize(function(onReady) {
    onReady(Object.keys(allFighters));
});

var router = express.Router();

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

router.get('/fighters/search*', function (req, res, next){
    var searchQuery = req.query.q;

    var searchResults  = autocomplete.search(searchQuery);
    console.log(searchResults);
    var fighterObjs = dedupFighters([].concat.apply([], searchResults.map(i => allFighters[i])));
    res.send(fighterObjs);
});



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
    if(!result.records){
      return [];
    }
    else{
      return result.records[0].get('p').segments;
    }

  });
}


router.get('/paths*', function(req, res, next){
    var winner = req.query.winner;
    var loser = req.query.loser;
    getPath(winner, loser).then( path =>{
      res.send(path);
    });
});



module.exports = router;
