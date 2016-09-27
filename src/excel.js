var libFs = require('fs');
var libPath = require('path');
var _  = require('lodash');

var xlsx = require('node-xlsx');

var Const = require('./const');
var utility = require('./utility');
var common = require('../lib/common');

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* EXCEL
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
var Excel = function(controller) {
    this.controller = controller;

    /**
     * [
     *     {
     *         name: "sheet name",
     *         data: [
     *             [cell1, cell2, ...], // row1
     *             [cell1, cell2, ...]  // row2
     *         ]
     *     },
     *     ...
     * ]
     */
    this.workbook = [];
};

Excel.prototype.buildReportExcel = function() {
    this.buildOverallSheet();
    this.dump();
};

Excel.prototype.buildOverallSheet = function() {
  var self = this;

  // 制作总体报表
  var sheet = new Sheet();

  if (self.controller.configs.type == 'WR') {
    sheet.addRow(['任务', "执行人", "截止时间", "任务状态", "工作列表", "工作条目", "汇报时间", "状态"]);
    _.each(self.controller.taskData, function(data) {
      var cells = [];
      cells.push(data.cardName);
      cells.push(data.cardMember);
      cells.push(common.dateToString(data.cardDueTime));
      cells.push(data.cardState);
      cells.push(data.checkListName);
      cells.push(data.itemName);
      cells.push(common.dateToString(data.itemDueTime));
      cells.push(data.itemState);
      sheet.addRow(cells);
    });
    sheet.addRow([]);
  } else if (self.controller.configs.type == 'DR') {
    sheet.addRow(['任务', "执行人", "截止时间", "任务状态", "汇报内容"]);
    _.each(self.controller.taskData, function(data) {
      var cells = [];
      cells.push(data.cardName);
      cells.push(data.cardMember);
      cells.push(common.dateToString(data.cardDueTime));
      cells.push(data.cardState);
      cells.push(data.message);
      sheet.addRow(cells);
    });
    sheet.addRow([]);
  }

  self.addSheet(self.controller.configs.name, sheet);
};

Excel.prototype.dump = function() {
  // 导出文件
  var dateString = this.controller.dateString;
  var file = xlsx.build(this.workbook);
  libFs.writeFileSync(libPath.join('csv', this.controller.configs.type + '_' + this.controller.configs.name + '_' + common.dateToString(dateString, true) + '.xlsx'), file, 'binary');
};

Excel.prototype.addSheet = function(name, sheet) {
  // 添加一个sheet页面到workbook
  if (!(sheet instanceof Sheet)) {
    throw new Error('Invalid sheet type: ' + (typeof sheet));
  }

  this.workbook.push({
    "name": name,
    "data": sheet.dump()
  });
};

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* SHEET
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
var Sheet = function() {
  /**
   * [
   *     [cell1, cell2, ...], // row1
   *     [cell1, cell2, ...]  // row2
   * ]
   */
  this.sheet = [];
};

Sheet.prototype.addRow = function(data) {
  if (_.isEmpty(data) || _.isUndefined(data)) {
      data = [];
  }

  this.sheet.push(data);
};

Sheet.prototype.dump = function() {
  return this.sheet;
};

module.exports = Excel;