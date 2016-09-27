var _       = require('lodash');
var libFs   = require('fs');
var libPath = require('path');
var repl    = require('repl');
var mailer  = require("nodemailer");
var Const   = require('./const');
var Excel   = require('./excel');
var common  = require('../lib/common');
var utility = require('./utility');

var Controller = function() {
  this.type       = null;
  this.dateString = null;
  this.configs    = null;

  this.taskData   = null;
};
var handler = new Controller();
var configs = require('../config/config.json');

Controller.prototype.run = function(type, dateString) {
  if (_.keys(configs).indexOf(type) === -1) {
    throw new Error('Invalid params:type: ' + type + ', it shall be included in: ' + JSON.stringify(_.keys(configs)));
  }

  if (typeof dateString == 'undefined') {
    dateString = common.dateToString(new Date());
  } else {
    var date = new Date(dateString);
    if (date == 'Invalid Date') {
      throw new Error('Invalid params:date: ' + dateString + ', it shall be a valid date!');
    }
  }

  // init params
  this.type       = type;
  this.dateString = dateString;
  this.configs    = configs[type];
  var _this = this;

  handler.collectTaskData().then(function (data) {
    return handler.buildTaskData(data);
  }).then(function(data) {
    return handler.sortTaskData(data);
  }).then(function(taskData) {
    handler.taskData = taskData;
    handler.report();

    if (_this.configs.mail.send == true) {
      console.log(_this.taskData);
      read("请检查报告内容，确定是否要发送邮件(Y/N)", function (r) {
        if (r.toUpperCase() == 'Y') {
          handler.sendMail();
        }
      });
    } else {
      console.log('build succeed!');
    }

  }).catch(utility.handleError);
};

Controller.prototype.collectTaskData = function() {
  var _this = this;
  var trelloData = require('./trelloData');
  var trelloDataHandler = new trelloData(_this.configs.trello.key, _this.configs.trello.token, _this.configs.trello.username);
  return trelloDataHandler.getData(_this.configs.filter);
};

Controller.prototype.buildTaskData = function(data) {
  var _this = this;
  var cardData = data.cardData;
  var actionData = data.actionData;
  var checklistData = data.checklistData;
  var now = common.dateToString(_this.dateString, true);

  var id;
  var idCard;
  for (var i1 in cardData) {
    if (!cardData.hasOwnProperty(i1)) {
      continue;
    }
    idCard = cardData[i1].id;
    cardData[i1].member = buildMembers(cardData[idCard].labels, _this.configs.filter.labels);
    cardData[i1].state = Const.CSV_KEY_COMPLETE;
    cardData[i1].messages = [];
    cardData[i1].checkList = {};
  }

  for (var i2 in actionData) {
    if (!actionData.hasOwnProperty(i2)) {
      continue;
    }

    idCard = actionData[i2].idCard;
    var message = actionData[i2].message;

    // 获取当天的所有message
    if (common.dateToString(actionData[i2].date, true) == now) {
      cardData[idCard].messages.push(message);
    }
  }

  for (var i3 in checklistData) {
    if (!checklistData.hasOwnProperty(i3) || checklistData[i3].checkItems.length == 0) {
      continue;
    }

    id = checklistData[i3].id;
    idCard = checklistData[i3].idCard;

    var checkItems = checklistData[i3].checkItems;

    cardData[idCard].checkList[id] = {
      id: id,
      name: checklistData[i3].name,
      due: 0,
      items: []
    };

    for (var j in checkItems) {
      if (!checkItems.hasOwnProperty(j)) {
        continue;
      }

      var tmp = checkItems[j].name.split("**");
      var itemDueTime = tmp.hasOwnProperty("1") ? tmp[1] : null;
      var itemDueTimestamp = (itemDueTime != null) ? Date.parse(new Date(itemDueTime)) : 0;

      if (checkItems[j].state != 'complete') {
        cardData[idCard].state = Const.CSV_KEY_INCOMPLETE;
      }

      cardData[idCard].checkList[id].items.push({
        name: tmp[0],
        due: itemDueTimestamp,
        state: (checkItems[j].state == 'complete') ? Const.CSV_KEY_COMPLETE : Const.CSV_KEY_INCOMPLETE
      });
    }

    var sortItems = common.jsonSort(cardData[idCard].checkList[id].items, "due");
    cardData[idCard].checkList[id].due = sortItems[sortItems.length - 1].due;
    cardData[idCard].checkList[id].items = sortItems;
  }

  return cardData;
};

Controller.prototype.sortTaskData = function(cardData) {

  var _this = this;

  // 对时间进行排序
  var cardArray = [];
  for (var m in cardData) {
    if (!cardData.hasOwnProperty(m)) {
      continue;
    }

    var checkListArray = [];
    var checkListData = cardData[m].checkList;
    for (var n in checkListData) {
      if (!checkListData.hasOwnProperty(n)) {
        continue;
      }
      checkListArray.push(checkListData[n]);
    }

    if (checkListArray.length == 0) {
      continue;
    }

    var sortCheckList = common.jsonSort(checkListArray, "due");
    cardData[m].due = sortCheckList[sortCheckList.length - 1].due;
    cardData[m].checkList = sortCheckList;
    cardArray.push(cardData[m]);
  }

  cardArray = common.jsonSort(cardArray, "due");

  // 整理输出结果
  var result = [];
  for (var i in cardArray) {
    if (!cardArray.hasOwnProperty(i)) {
      continue;
    }

    if (_this.configs.type == 'WR') {
      result = buildWR(cardArray[i], result);
    } else if (_this.configs.type == 'DR') {
      result = buildDR(cardArray[i], result);
    }

  }

  return result;
};

Controller.prototype.report = function() {
  handler.excel = new Excel(this);
  handler.excel.buildReportExcel();
};

Controller.prototype.sendMail = function() {
  var _this = this;
  var html = "<table width='100%' border='1'>";

  if (_this.configs.type == 'WR') {
    html+= "<colgroup>" +
      "<col width='20%'>" +
      "<col width='10%'>" +
      "<col width='7%'>" +
      "<col width='7%'>" +
      "<col width='15%'>" +
      "<col width='20%'>" +
      "<col width='7%'>" +
      "<col width='7%'>" +
      "</colgroup>";
    html+= "<tr>" +
      "<td>任务</td>" +
      "<td>执行人</td>" +
      "<td>截止时间</td>" +
      "<td>任务状态</td>" +
      "<td>工作列表</td>" +
      "<td>工作条目</td>" +
      "<td>汇报时间</td>" +
      "<td>状态</td>" +
      "</tr>";
    _.each(_this.taskData, function(data) {
      html+= "<tr>" +
        "<td>" + data.cardName + "</td>" +
        "<td>" + data.cardMember + "</td>" +
        "<td>" + common.dateToString(data.cardDueTime) + "</td>" +
        "<td>" + data.cardState + "</td>" +
        "<td>" + data.checkListName + "</td>" +
        "<td>" + data.itemName + "</td>" +
        "<td>" + common.dateToString(data.itemDueTime) + "</td>" +
        "<td>" + data.itemState + "</td>" +
        "</tr>";
    });
  } else if (_this.configs.type == 'DR') {
    html+= "<colgroup>" +
      "<col width='20%'>" +
      "<col width='10%'>" +
      "<col width='7%'>" +
      "<col width='7%'>" +
      "<col width='35%'>" +
      "<col width='20%'>" +
      "</colgroup>";
    html+= "<tr>" +
      "<td>任务</td>" +
      "<td>执行人</td>" +
      "<td>截止时间</td>" +
      "<td>任务状态</td>" +
      "<td>汇报内容</td>" +
      "</tr>";
    _.each(_this.taskData, function(data) {
      html+= "<tr>" +
        "<td>" + data.cardName + "</td>" +
        "<td>" + data.cardMember + "</td>" +
        "<td>" + common.dateToString(data.cardDueTime) + "</td>" +
        "<td>" + data.cardState + "</td>" +
        "<td>" + data.message + "</td>" +
        "</tr>";
    });
  }

  html+= "</table>";

  var mailConfig = _this.configs.mail;
  var fileName = _this.configs.type + '_' + _this.configs.name + '_' + common.dateToString(_this.dateString, true);
  var transport = mailer.createTransport('smtps://' + mailConfig.setting);

  // 发送邮件
  transport.sendMail({
    from : mailConfig.from,
    to : mailConfig.to,
    generateTextFromHTML : true,
    subject: fileName,
    html : html,
    attachments: [
      {
        filename: fileName + '.xlsx',
        path: libPath.join('csv', fileName + '.xlsx')
      }
    ]
  }, function(error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("build succeed!");
    }
    transport.close();
  });
};

module.exports = handler;

function buildMembers(labels, filter) {
  var members = null;
  for (var i in labels) {
    if (labels.hasOwnProperty(i) && common.inArray(labels[i].name, filter)) {
      members = (members == null) ? labels[i].name : members + "," +labels[i].name;
    }
  }
  return members;
}

function buildWR(card, r) {
  var checkList = card.checkList;
  if (checkList.length == 0) {
    return r;
  }

  for (var i in checkList) {
    if (!checkList.hasOwnProperty(i)) {
      continue;
    }

    // 不重复显示
    var items = checkList[i].items;

    var firstLoop1 = (i == 0);
    for (var j in items) {
      if (!items.hasOwnProperty(j)) {
        continue;
      }

      // 不重复显示
      var firstLoop2 = (j == 0);
      r.push({
        cardName: (firstLoop1 && firstLoop2) ? card.name : "",
        cardMember: (firstLoop1 && firstLoop2) ? card.member : "",
        cardDueTime: (firstLoop1 && firstLoop2) ? card.due : "",
        cardState: (firstLoop1 && firstLoop2) ? card.state : "",
        checkListName: (firstLoop2) ? checkList[i].name : "",
        itemName: items[j].name,
        itemDueTime: items[j].due,
        itemState: items[j].state
      })
    }
  }

  r.push({
    cardName: "",
    cardMember: "",
    cardDueTime: "",
    cardState: "",
    checkListName: "",
    itemName: "",
    itemDueTime: "",
    itemState: ""
  });

  return r;
}

function buildDR(card, r) {
  var messages = card.messages;
  if (messages.length == 0) {
    return r;
  }

  for (var i in messages) {
    if (!messages.hasOwnProperty(i)) {
      continue;
    }

    var tmp = messages[i].split("\n");
    var changeTxt = (tmp[0] == '时间调整') ? tmp[1] : "";

    // 不重复显示
    var firstLoop1 = (i == 0);
    r.push({
      cardName: (firstLoop1) ? card.name : "",
      cardMember: (firstLoop1) ?card.member : "",
      cardDueTime: (firstLoop1) ? card.due : "",
      cardState: (firstLoop1) ? card.state : "",
      message: messages[i]
    })
  }

  r.push({
    cardName: "",
    cardMember: "",
    cardDueTime: "",
    cardState: "",
    message: ""
  });

  return r;
}

function read(prompt, callback) {
  process.stdout.write(prompt + ':');
  process.stdin.resume();
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', function(chunk) {
    process.stdin.pause();
    callback(chunk.replace(/\s+/g, ''));
  });
}