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

  dateToString: function (timestamp, noLodash) {
    if (timestamp == "") return timestamp;
    var date = new Date(timestamp);
    if (date == 'Invalid Date') return "";

    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    var day = date.getDate();
    if (day < 10) {
      day = '0' + day;
    }

    if (noLodash == true) {
      return year + '' + month + '' + day;
    } else {
      return year + '-' + month + '-' + day;
    }
  }
};
