$().ready(
    function() {

        //Fit to placeholder
        $("input[placeholder]").each(function() {
            $(this).attr('size', $(this).attr('placeholder').length);
        });

        var engine = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: 'ufcFighters.json',
            ttl: 0,
            remote: {
                wildcard: "%query",
                url: "api/fighters/search?q=%query"
            }

        });
        engine.initialize();

        var typeaheadOptions = {
            name: 'engine',
            limit: 10,
            source: engine.ttAdapter(),
            displayKey: "name",
            templates: {
                empty: [
                    '<p>Unable to find a fighter with the current query</p>',
                ].join('\n'),
                suggestion: function(data) {
                    var displayName = data.name;
                    if (data.nickname) {
                        var nameList = data.name.split(' ');
                        displayName = nameList[0] + ' "' + data.nickname + '" ' + nameList.slice(1).join(' ');
                    }
                    return Handlebars.compile('<p>{{displayName}}</p>')({
                        displayName: displayName
                    });
                }
            }
        };


        $('#winner .typeahead').typeahead(null, typeaheadOptions).on('typeahead:selected',
            function(obj, datum) {
                $("#winner input").attr('size', datum.name.length);
                $("#winner").attr("data-fighter-id", datum.fighterID);
            });
        $('#loser .typeahead').typeahead(null, typeaheadOptions).on('typeahead:selected',
            function(obj, datum) {
                $("#loser input").attr('size', datum.name.length);
                $("#loser").attr("data-fighter-id", datum.fighterID);
            });


        var $winnerInput = $("#winner .tt-input");
        $winnerInput.on('input', function() {
            console.log("INPUT EVENT");
            if (!$winnerInput.val()) {
                $("#winner input").attr('size', $winnerInput.attr('placeholder').length);
                $("#winner").attr("data-fighter-id", "");
            }
        });

        var $loserInput = $("#loser .tt-input");
        $loserInput.on('input', function() {
            if (!$loserInput.val()) {
                $loserInput.attr('size', $loserInput.attr('placeholder').length);
                $("#loser").attr("data-fighter-id", "");
            }
        });
    });
