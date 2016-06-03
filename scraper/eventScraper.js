function parseFightCard(fightCard){
  var fighters = {"fighter1":fightCard.find('.player1'),
"fighter2":fightCard.find('.player2')};
  var winner = fightCard.find('winner').attr('class').split(' ')[1];
  return fighters[winner];
}
