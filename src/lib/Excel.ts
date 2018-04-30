import * as LibFs from 'fs-extra';
import * as LibPath from 'path';
import * as _ from 'lodash';
import * as xlsx from 'node-xlsx';
import * as Utility from './Utility';
import {ExtraCardSchema} from '../reporter-gen';

export class Excel {
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
    private _workbook: Array<any>;
    private _title: string;
    private _data: Array<ExtraCardSchema>;

    constructor(title: string, data: Array<ExtraCardSchema>) {
        this._workbook = [];
        this._title = title;
        this._data = data;
    }

    public run() {
        this.buildOverallSheet();
        this.dump();
    }

    private buildOverallSheet() {
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
    };

    private _addSheet(name: string, sheet: ExcelSheet) {
        this._workbook.push({
            'name': name,
            'data': sheet.dump()
        });
    }

    private dump() {
        let file = xlsx.build(this._workbook);
        LibFs.writeFileSync(LibPath.join(process.cwd(), this._title + '.xlsx'), file, 'binary');
    };
}

class ExcelSheet {
    /**
     * [
     *     [cell1, cell2, ...], // row1
     *     [cell1, cell2, ...]  // row2
     * ]
     */
    private _sheet: Array<any>;

    constructor() {
        this._sheet = [];
    }

    public addRow(rowData: Array<any>) {
        if (_.isEmpty(rowData) || _.isUndefined(rowData)) {
            rowData = [];
        }

        this._sheet.push(rowData);
    }

    public dump() {
        return this._sheet;
    }
}