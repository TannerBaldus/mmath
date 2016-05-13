$().ready(
  function(){
    var engine = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: 'ufcFighters.json',
    ttl:0,
    remote: {
      wildcard: "%query",
      url: "api/fighters/search?q=%query"
    },
    suggestion: function(data) {
    return Handlebars.compile('<li img={{img}} id={{fighterID}}>{{name}}</li>')(data);
    }
  });


var typeaheadOptions = {
  name: 'engine',
  limit:10,
  source: engine.ttAdapter(),
  displayKey: "name",
  templates: {
    empty: [
      '<div class="empty-message">',
        'Unable to find a fighter with the current query',
      '</div>'
    ].join('\n'),
    suggestion: function(data){return Handlebars.compile('<li img={{img}} id={{fighterID}}>{{name}}</li>')(data);}
  }
};

  engine.initialize();
  // passing in `null` for the `options` arguments will result in the default
  // options being used
$('#bloodhound .typeahead').typeahead(null, typeaheadOptions)
  .on('typeahead:selected', function (obj, datum) {
    $('#winner img').attr('src', datum.img);
    $('#winner').attr('data-internalid', datum.fighterID);

    console.log(obj);
    console.log(datum);
  });
});
