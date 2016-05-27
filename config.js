
var config = {};

config.db = {};
config.scraper = {};

config.db.url =  "bolt://localhost";
config.db.username = "neo4j";
config.db.password = "neo4j";
config.scraper.userAgent = "request";
module.exports = config;
