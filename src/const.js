var libPath = require('path');

var Const = function() {};

Const.PATH_CSV = libPath.join(__dirname, 'csv');

Const.CSV_KEY_COMPLETE = '完成';
Const.CSV_KEY_INCOMPLETE = '未完成';

module.exports = Const;