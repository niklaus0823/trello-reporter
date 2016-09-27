var Utility = function() {};

Utility.prototype.handleError = function(error) {
    console.error(error.stack);
};

module.exports = new Utility();