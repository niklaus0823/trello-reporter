var moment = require('moment');
var libPath = require('path');

var Const = require('./const');

var Utility = function() {};

Utility.prototype.calcDateMillisecondInterval = function(date1, date2) { // Format shall be 'YYYY-MM-DD'
    var moment1 = moment(date1, 'YYYY-MM-DD');
    var moment2 = moment(date2, 'YYYY-MM-DD');

    return moment1.diff(moment2);
};

Utility.prototype.calcDateHourInterval = function(date1, date2) { // Format shall be 'YYYY-MM-DD HH:mm'
    var moment1 = moment(date1, 'YYYY-MM-DD HH:mm');
    var moment2 = moment(date2, 'YYYY-MM-DD HH:mm');

    return moment1.diff(moment2, 'days') * 8;
};

Utility.prototype.handleError = function(error) {
    console.error(error.stack);
};

Utility.prototype.buildTargetCsvPath = function(projCode, dateMonth) {
    return libPath.join(Const.PATH_CSV, projCode, dateMonth);
};

module.exports = new Utility();