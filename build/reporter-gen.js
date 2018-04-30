"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibPath = require("path");
const _ = require("lodash");
const program = require("commander");
const mailer = require("nodemailer");
const trello_api_1 = require("trello-api");
const Utility = require("./lib/Utility");
const Excel_1 = require("./lib/Excel");
const debug = require('debug')('reporter:gen');
const pkg = require('../package.json');
program.version(pkg.version)
    .option('-d, --date <string>', 'Export the report for the specified date. format:YYYY-mm-dd')
    .parse(process.argv);
const DATE = program.date === undefined ? '' : program.date;
class CLI {
    static instance() {
        return new CLI();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            debug('CLI start.');
            this._boards = {};
            this._lists = {};
            this._cards = {};
            this._checklists = {};
            this._comments = {};
            try {
                yield this._validate();
                yield this._collect();
                yield this._process();
                yield this._generate();
            }
            catch (e) {
                throw new Error(e);
            }
            debug('CLI run over.');
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            let settingPath = LibPath.join(__dirname, '..', 'configs', 'setting.json');
            try {
                this._setting = Utility.getSetting(settingPath);
            }
            catch (e) {
                throw new Error('Please run the "reporter config" command to generate the setting file first.');
            }
            let date = new Date();
            if (DATE != '') {
                let dateInput = new Date(DATE);
                if (dateInput == 'Invalid Date') {
                    throw new Error('Wrong date, format: YYYY-mm-dd.');
                }
                else {
                    date = dateInput;
                }
            }
            this._date = Utility.dateToString(date);
        });
    }
    _collect() {
        return __awaiter(this, void 0, void 0, function* () {
            let trello = new trello_api_1.Trello(this._setting.trello_key, this._setting.trello_token);
            yield trello.getBoards(this._setting.trello_memberId)
                .then((boards) => this._loadBoards(boards))
                .then(() => {
                let p = [];
                Object.keys(this._boards).forEach((boardId) => {
                    p.push(this._loadLists(trello, boardId));
                });
                return Promise.all(p);
            })
                .then(() => {
                // get cards
                let p = [];
                Object.keys(this._boards).forEach((boardId) => {
                    p.push(this._loadCards(trello, boardId));
                });
                return Promise.all(p);
            })
                .then(() => {
                // get checklist
                let p = [];
                Object.keys(this._boards).forEach((boardId) => {
                    p.push(this._loadChecklists(trello, boardId));
                });
                return Promise.all(p);
            })
                .then(() => {
                // get comment card
                let p = [];
                Object.keys(this._cards).forEach((cardId) => {
                    p.push(this._loadCommentCard(trello, cardId));
                });
                return Promise.all(p);
            })
                .catch((err) => {
                throw new Error(err);
            });
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            // 通过获取 checklist name 中的 **2018-01-01** 数据排序后得到 card 的截止时间。
            Object.keys(this._checklists).forEach((checklistId) => {
                let checklist = this._checklists[checklistId];
                checklist.checkItems.forEach((checkItem) => {
                    let tmp = checkItem.name.split('**');
                    let itemDueTime = tmp.hasOwnProperty(1) ? tmp[1] : null;
                    let itemDueDate = new Date(itemDueTime);
                    let itemDueTimestamp = (itemDueTime != null && itemDueDate != 'Invalid Date') ? Date.parse(Utility.dateToString(itemDueDate)) : 0;
                    this._cards[checklist.idCard].checklistItems.push(checkItem);
                    if (this._cards[checklist.idCard].deadline < itemDueTimestamp) {
                        this._cards[checklist.idCard].deadline = itemDueTimestamp;
                    }
                    if (this._cards[checklist.idCard].complete == true && checkItem.state != 'complete') {
                        this._cards[checklist.idCard].complete = false;
                    }
                });
            });
            // 遍历 CommentCards 按 Card 分组
            Object.keys(this._comments).forEach((commentId) => {
                let comment = this._comments[commentId];
                this._cards[comment.data.card.id].comments.push(comment);
            });
        });
    }
    _generate() {
        return __awaiter(this, void 0, void 0, function* () {
            let cards = [];
            Object.keys(this._cards).forEach((cardId) => {
                let card = this._cards[cardId];
                if (card.comments.length == 0) {
                    return;
                }
                cards.push(card);
            });
            let title = this._setting.title + '_' + this._date;
            let excel = new Excel_1.Excel(title, cards);
            excel.run();
            this._sendMail(title, cards);
        });
    }
    _sendMail(title, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._setting.mail_send == 'true') {
                process.stdout.write('Do you need to send reporter mail?(Y/N)');
                process.stdin.resume();
                process.stdin.setEncoding('utf-8');
                process.stdin.on('data', (chunk) => {
                    process.stdin.pause();
                    let response = chunk.replace(/\s+/g, '');
                    if (response.toUpperCase() == 'Y') {
                        let html = `<table width='100%' border='1' cellpadding='1' cellspacing='1'>`;
                        html += `<colgroup>
                            <col width='20%'>
                            <col width='10%'>
                            <col width='7%'>
                            <col width='7%'>
                            <col width='35%'>
                            <col width='20%'>
                    </colgroup>`;
                        html += `<tr>
                            <td>CardName</td>
                            <td>LabelName</td>
                            <td>Deadline</td>
                            <td>State</td>
                            <td>Messages</td>
                    </tr>`;
                        _.each(data, (card) => {
                            html += `<tr>
                            <td>${card.name}</td>
                            <td>${card.labelNames}</td>
                            <td>${Utility.dateToString(new Date(card.deadline))}</td>
                            <td>${(card.complete) ? 'processing' : 'completed'}</td>
                            <td>${card.comments[0].data.text}</td>
                        </tr>`;
                            if (card.comments.length <= 1) {
                                return;
                            }
                            for (let i = 0; i < (card.comments.length - 1); i++) {
                                html += `<tr>
                                <td> </td>
                                <td> </td>
                                <td> </td>
                                <td> </td>
                                <td>${card.comments[i + 1].data.text}</td>
                            </tr>`;
                            }
                        });
                        html += `</table>`;
                        let signedConfig = {
                            host: this._setting.mail_smtp,
                            port: 465,
                            secure: true,
                            auth: {
                                user: this._setting.mail_username,
                                pass: this._setting.mail_password
                            },
                            tls: {
                                // do not fail on invalid certs
                                rejectUnauthorized: false
                            }
                        };
                        let transport = mailer.createTransport(signedConfig);
                        // 发送邮件
                        transport.sendMail({
                            from: this._setting.mail_from,
                            to: this._setting.mail_to,
                            subject: title,
                            html: html,
                            attachments: [
                                {
                                    filename: title + '.xlsx',
                                    path: LibPath.join(process.cwd(), title + '.xlsx')
                                }
                            ]
                        }, (error) => {
                            if (error) {
                                console.log(error);
                            }
                            else {
                                console.log('reporter mail send succeed!');
                            }
                            transport.close();
                        });
                    }
                });
            }
            else {
                console.log('reporter generate succeed!');
            }
        });
    }
    _loadBoards(boards) {
        boards.forEach((board) => {
            if (this._setting.filter_boards.indexOf(board.name) != -1) {
                this._boards[board.id] = board;
            }
        });
    }
    _loadLists(trello, boardId) {
        return new Promise((resolve) => {
            trello.getLists(boardId)
                .then((lists) => {
                lists.forEach((list) => {
                    if (this._setting.filter_lists.length == 0 || this._setting.filter_lists.indexOf(list.name) != -1) {
                        this._lists[list.id] = list;
                    }
                });
                resolve();
            });
        });
    }
    _loadCards(trello, boardId) {
        return new Promise((resolve) => {
            let listIds = Object.keys(this._lists);
            trello.getCards(boardId)
                .then((cards) => {
                cards.forEach((card) => {
                    if (listIds.indexOf(card.idList) != -1 && this._findLabelName(card.labels)) {
                        card.deadline = 0;
                        card.complete = true;
                        card.checklistItems = [];
                        card.comments = [];
                        card.labelNames = this._getLabelName(card.labels);
                        this._cards[card.id] = card;
                    }
                });
                resolve();
            });
        });
    }
    _findLabelName(labels) {
        if (this._setting.filter_labels.length == 0) {
            return true;
        }
        for (let label of labels) {
            if (this._setting.filter_labels.indexOf(label.name) != -1) {
                return true;
            }
        }
        return false;
    }
    _getLabelName(labels) {
        let labelNames = [];
        for (let label of labels) {
            if (this._setting.filter_labels.length == 0 || this._setting.filter_labels.indexOf(label.name) != -1) {
                labelNames.push(label.name);
            }
        }
        return labelNames;
    }
    _loadChecklists(trello, boardId) {
        return new Promise((resolve) => {
            let cardIds = Object.keys(this._cards);
            trello.getChecklists(boardId)
                .then((checklists) => {
                checklists.forEach((checklist) => {
                    if (cardIds.indexOf(checklist.idCard) != -1) {
                        this._checklists[checklist.id] = checklist;
                    }
                });
                resolve();
            });
        });
    }
    _loadCommentCard(trello, cardId) {
        return new Promise((resolve) => {
            let cardIds = Object.keys(this._cards);
            trello.getCommentsOnCard(cardId)
                .then((comments) => {
                comments.forEach((comment) => {
                    // 只加载当前 card 下的 comment，并且 comment 的创建时间是今天
                    if (cardIds.indexOf(comment.data.card.id) != -1 && Utility.dateToString(new Date(comment.date)) == this._date) {
                        this._comments[comment.id] = comment;
                    }
                });
                resolve();
            });
        });
    }
}
CLI.instance().run().catch((err) => {
    console.log('err: ', err.message);
});
