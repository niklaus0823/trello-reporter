"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("fs-extra");
const LibPath = require("path");
const _ = require("lodash");
const xlsx = require("node-xlsx");
const Utility = require("./Utility");
class Excel {
    constructor(title, data) {
        this._workbook = [];
        this._title = title;
        this._data = data;
    }
    run() {
        this.buildOverallSheet();
        this.dump();
    }
    buildOverallSheet() {
        let sheet = new ExcelSheet();
        sheet.addRow(['CardName', 'LabelName', 'Deadline', 'State', 'Messages']);
        _.each(this._data, (data) => {
            let cells = [];
            cells.push(data.name);
            cells.push(data.labelNames);
            cells.push(Utility.dateToString(new Date(data.deadline)));
            cells.push((data.complete) ? 'processing' : 'completed');
            cells.push(data.comments[0].data.text);
            sheet.addRow(cells);
            if (data.comments.length <= 1) {
                return;
            }
            for (let i = 0; i < (data.comments.length - 1); i++) {
                let cells = [];
                cells.push('');
                cells.push('');
                cells.push('');
                cells.push('');
                cells.push(data.comments[i + 1].data.text);
                sheet.addRow(cells);
            }
        });
        sheet.addRow([]);
        this._addSheet(this._title, sheet);
    }
    ;
    _addSheet(name, sheet) {
        this._workbook.push({
            'name': name,
            'data': sheet.dump()
        });
    }
    dump() {
        let file = xlsx.build(this._workbook);
        LibFs.writeFileSync(LibPath.join(process.cwd(), this._title + '.xlsx'), file, 'binary');
    }
    ;
}
exports.Excel = Excel;
class ExcelSheet {
    constructor() {
        this._sheet = [];
    }
    addRow(rowData) {
        if (_.isEmpty(rowData) || _.isUndefined(rowData)) {
            rowData = [];
        }
        this._sheet.push(rowData);
    }
    dump() {
        return this._sheet;
    }
}
