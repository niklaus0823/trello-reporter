var controller = require('./src/controller');

var teamName  = process.argv[2];
var dateString = process.argv[3];

controller.run(teamName, dateString);