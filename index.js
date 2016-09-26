var controller = require('./src/controller');

var teamName  = process.argv[2];
var dateMonth = process.argv[3];

controller.run(teamName, dateMonth);