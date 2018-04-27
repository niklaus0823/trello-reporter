import * as LibPath from 'path';
import * as program from 'commander';
import {Trello, BoardSchema, ListSchema, CardSchema, ChecklistSchema, CommentCardSchema} from 'trello-api';
import * as Utility from './lib/Utility';

const debug = require('debug')('reporter:gen');
const pkg = require('../package.json');

program.version(pkg.version)
    .option('-d, --date <string>', 'Export the report for the specified date. format:YYYY-mm-dd')
    .parse(process.argv);

const DATE = (program as any).date === undefined ? '' : (program as any).date;

class CLI {

    private _setting: Utility.SettingSchema;
    private _date: Date;
    private _boards: {[key: string]: BoardSchema};
    private _lists: {[key: string]: ListSchema};
    private _cards: {[key: string]: CardSchema};
    private _checklists: {[key: string]: ChecklistSchema};
    private _comments: {[key: string]: CommentCardSchema};

    static instance() {
        return new CLI();
    }

    public async run() {
        debug('CLI start.');

        this._boards = {};
        this._lists = {};
        this._cards = {};
        this._checklists = {};
        this._comments = {};

        try {
            await this._validate();
            await this._collect();
            await this._filter();
            await this._generate();
            await this._send();
        } catch (e) {
            throw new Error(e);
        }

        debug('CLI run over.');
    }

    private async _validate() {
        let settingPath = LibPath.join(__dirname, '..', 'configs', 'setting.json');

        try {
            this._setting = Utility.getSetting(settingPath);
        } catch (e) {
            throw new Error('Please run the "reporter config" command to generate the setting file first.');
        }

        if (DATE === '') {
            this._date = new Date();
        } else {
            let date = new Date(DATE);
            if (date as any == 'Invalid Date') {
                throw new Error('Wrong date, format: YYYY-mm-dd.');
            } else {
                this._date = date;
            }
        }
    }

    private async _collect() {
        let trello = new Trello(this._setting.trello_key, this._setting.trello_token);

        await trello.getBoards(this._setting.trello_memberId)
            .then((boards: Array<BoardSchema>) => this._loadBoards(boards))
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
            .then(() => {
                console.log('_collect over');
            })
            .catch((err) => {
                throw new Error(err);
            });
    }

    private async _filter() {
        let now = Utility.dateToString(this._date);

    }
    private async _generate() {

    }

    private async _send() {

    }

    private _loadBoards(boards: Array<BoardSchema>) {
        boards.forEach((board) => {
            if (this._setting.filter_boards.indexOf(board.name) != -1) {
                this._boards[board.id] = board;
            }
        });
    }

    private _loadLists(trello: Trello, boardId: string): Promise<void> {
        return new Promise((resolve) => {
            trello.getLists(boardId)
                .then((lists: Array<ListSchema>) => {
                    lists.forEach((list) => {
                        if (this._setting.filter_lists.length == 0 || this._setting.filter_lists.indexOf(list.name) != -1) {
                            this._lists[list.id] = list;
                        }
                    });
                    resolve();
                });
        });
    }

    private _loadCards(trello: Trello, boardId: string): Promise<void> {
        return new Promise((resolve) => {
            let listIds = Object.keys(this._lists);
            trello.getCards(boardId)
                .then((cards: Array<CardSchema>) => {
                    cards.forEach((card) => {
                        if (listIds.indexOf(card.idList) != -1) {
                            this._cards[card.id] = card;
                        }
                    });
                    resolve();
                });
        });
    }

    private _loadChecklists(trello: Trello, boardId: string): Promise<void> {
        return new Promise((resolve) => {
            let cardIds = Object.keys(this._cards);
            trello.getChecklists(boardId)
                .then((checklists: Array<ChecklistSchema>) => {
                    checklists.forEach((checklist) => {
                        if (cardIds.indexOf(checklist.idCard) != -1) {
                            this._checklists[checklist.id] = checklist;
                        }
                    });
                    resolve();
                });
        });
    }

    private _loadCommentCard(trello: Trello, cardId: string): Promise<void> {
        return new Promise((resolve) => {
            let cardIds = Object.keys(this._cards);
            trello.getCommentsOnCard(cardId)
                .then((comments: Array<CommentCardSchema>) => {
                    comments.forEach((comment) => {
                        if (cardIds.indexOf(comment.data.card.id)) {
                            this._comments[comment.id] = comment;
                        }
                    });
                    resolve();
                });
        });
    }
}

CLI.instance().run().catch((err: Error) => {
    console.log('err: ', err.message);
});