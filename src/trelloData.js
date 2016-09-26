var Trello  = require("trello");
var common  = require('../lib/common');

var TrelloData = function (key, token, username) {
  this.trello = new Trello(key, token);
  this.username = username;
  this.filter = {
    "boardName" : [],
    "listNames" : []
  };

  this.boardData = [];
  this.listData = [];
  this.cardData = {};
  this.checklistData = [];
  this.actionData = [];
};

TrelloData.prototype.getData = function(filter) {
  var _this = this;
  _this.filter = filter;
  return new Promise(function(resolve) {
    _this.getBoards(_this.username)
      .then(function () {
        return _this.getListsOnBoard()
      })
      .then(function () {
        return _this.getCardsOnList()
      })
      .then(function () {
        return _this.getChecklistsOnCard()
      })
      .then(function () {
        return _this.getActionsOnCard()
      })
      .then(function () {
        resolve(_this);
      });

  })
};

TrelloData.prototype.getBoards = function(username) {
  var _this = this;
  return _this.trello.getBoards(username).then(function (res) {
    var data = [];
    for (var i in res) {
      if (res.hasOwnProperty(i) && common.inArray(res[i].name, _this.filter.boardName)) {
        data.push({
          id: res[i].id,
          name: res[i].name
        });
      }
    }
    _this.boardData = data;
  });
};

TrelloData.prototype.getListsOnBoard = function () {
  var _this = this;
  var p = [];
  for (var i in _this.boardData) {
    p.push(new Promise(function (resolve) {
      _this.trello.getListsOnBoard(_this.boardData[i].id).then(function (res) {
        for (var j in res) {
          if (res.hasOwnProperty(j) && common.inArray(res[j].name, _this.filter.listNames)) {
            _this.listData.push({
              id: res[j].id,
              name: res[j].name
            });
          }
        }

        resolve();
      });
    }));
  }
  return Promise.all(p);
};

TrelloData.prototype.getCardsOnList = function () {
  var _this = this;
  var p = [];
  for (var i in _this.listData) {
    p.push(new Promise(function (resolve) {
      _this.trello.getCardsOnList(_this.listData[i].id).then(function (res) {
        for (var j in res) {
          if (res.hasOwnProperty(j)) {
            _this.cardData[res[j].id] = {
              id: res[j].id,
              name: res[j].name,
              labels: res[j].labels,
              due: res[j].due
            };
          }
        }

        resolve();
      });
    }));
  }

  return Promise.all(p);
};

TrelloData.prototype.getChecklistsOnCard = function () {
  var _this = this;
  var p = [];
  for (var i in _this.cardData) {
    p.push(new Promise(function (resolve) {
      _this.trello.getChecklistsOnCard(_this.cardData[i].id).then(function (res) {
        for (var j in res) {
          if (res.hasOwnProperty(j)) {
            _this.checklistData.push({
              id: res[j].id,
              name: res[j].name,
              idCard: res[j].idCard,
              checkItems: res[j].checkItems
            });
          }
        }
        resolve();
      });
    }));
  }
  return Promise.all(p);
};


TrelloData.prototype.getActionsOnCard = function () {
  var _this = this;
  var p = [];
  for (var i in _this.cardData) {
    p.push(new Promise(function (resolve) {
      _this.trello.getActionsOnCard(_this.cardData[i].id).then(function (res) {
        for (var j in res) {
          if (res.hasOwnProperty(j)) {
            if (res[j].type == "commentCard") {
              _this.actionData.push({
                id: res[j].id,
                idCard: res[j].data.card.id,
                date: res[j].date,
                message: res[j].data.text
              })
            }
          }

        }
        resolve();
      });
    }));
  }
  return Promise.all(p);
};

module.exports = TrelloData;