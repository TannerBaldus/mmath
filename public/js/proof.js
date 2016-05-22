function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}


function reverseSearchString(){
    var winnerID = getQueryVariable("winnerID");
    var loserID = getQueryVariable("loserID");
    return "?winnerID="+loserID+"&loserID="+winnerID;
}


function buildProof(data){
    var prooftemplate =`
    <div>
    {{#if path}}
        {{#each path.segments}}
            <p> {{this.start.properties.name}} &gt {{this.end.properties.name}} </p>
        {{/each}}
    {{else}}
        <p>No Path Found.</p>
    {{/if}}
    </div>
    `;

    var proofHTML = Handlebars.compile(prooftemplate)({path:data.path});
    return proofHTML;
}


function buildMatchUp(data) {
    var matchupTemplate = `
    <ul class="matchup-list list-inline">
        <li class="matchup-winner">
            <h2>{{start.properties.name}}</h2>
            {{#if start.properties.nickname}}
                <p>"{{start.properties.nickname}}"</p>
            {{else}}
                <p class=transparent>Padding</p>
            {{/if}}
        </li>
        <li class="matchup-gt">
            <h2>&gt</h2>
            <p class="transparent">Padding</p>
        </li>
        <li class="matchup-loser">
            <h2>{{end.properties.name}}</h2>
            {{#if end.properties.nickname}}
                <p>"{{end.properties.nickname}}"</p>
            {{else}}
                <p class=transparent>Padding</p>
            {{/if}}
        </li>
    </ul>
    `;
    var matchupHTML = Handlebars.compile(matchupTemplate)({start:data.winner,
        end:data.loser});
    return matchupHTML;
}

$(function() {

    $.get('api/paths' + window.location.search)

    .done(function(data) {

        console.log("DATA: "+data);
        $('.matchup').append(buildMatchUp(data));
        $('.proof').append(buildProof(data));
    })

    .fail(function() {
        swal({
            title: "Error",
            text: "Something went wrong.",
            type: "error",
            confirmButtonText: "Ok."
        });

    });
    $('.reverse').click(function(){
        window.location.href = "proof.html"+reverseSearchString();

    });

});
