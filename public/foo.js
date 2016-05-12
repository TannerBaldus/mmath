function formatNeo4jJson(jsonString){
  return JSON.parse(jsonString).results[0].data.map(i => i.row);
}
