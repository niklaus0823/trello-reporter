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
const program = require("commander");
const trello_api_1 = require("trello-api");
const Utility = require("./lib/Utility");
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
                yield this._generate();
                yield this._send();
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
            if (DATE === '') {
                this._date = new Date();
            }
            else {
                let date = new Date(DATE);
                if (date == 'Invalid Date') {
                    throw new Error('Wrong date, format: YYYY-mm-dd.');
                }
                else {
                    this._date = date;
                }
            }
        });
    }
    _collect() {
        return __awaiter(this, void 0, void 0, function* () {
            let trello = new trello_api_1.Trello(this._setting.trello_key, this._setting.trello_token);
            trello.getBoards(this._setting.trello_memberId)
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
    _generate() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    _send() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    if (listIds.indexOf(card.idList) != -1) {
                        this._cards[card.id] = card;
                    }
                });
                resolve();
            });
        });
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
                    console.log(comment);
                    // if (cardIds.indexOf(comment.id) != -1) {
                    //     this._checklists[checklist.id] = checklist;
                    // }
                });
                resolve();
            });
        });
    }
}
CLI.instance().run().catch((err) => {
    console.log('err: ', err.message);
});
