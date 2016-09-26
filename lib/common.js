module.exports = {
  inArray: function (val, arr) {
    for (var i in arr) {
      if (arr.hasOwnProperty(i) && arr[i] == val) {
        return true
      }
    }

    return false;
  },

  jsonSort: function (array, field, reverse) {
    if (array.length < 2 || !field || typeof array[0] !== "object") return array;
    if (typeof array[0][field] === "number") {
      array.sort(function(x, y) { return x[field] - y[field]});
    }
    if (typeof array[0][field] === "string") {
      array.sort(function(x, y) { return x[field].localeCompare(y[field])});
    }
    if (reverse) {
      array.reverse();
    }
    return array;
  },

  dateToString: function (timestamp) {
    if (timestamp == "") return timestamp;
    var date = new Date(timestamp);
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }
};
