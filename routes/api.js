var express = require('express');
var jsonfile = require('jsonfile');
var Autocomplete = require('autocomplete');
var url = require('url');
var autocomplete = Autocomplete.connectAutocomplete();
var allFighters = jsonfile.readFileSync('public/allFighters.json');


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
    var fighterObjs = dedupFighters([].concat.apply([], searchResults.map(i => allFighters[i])));
    res.send(fighterObjs);
});



module.exports = router;
