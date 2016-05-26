
var config = {};

config.db = {};
config.scraper = {};

dbUrl = require('url').parse(process.env.GRAPHENEDB_URL);
config.db.url = dbUrl || "bolt://localhost";
config.scraper.userAgent = "request";
module.exports = config;
