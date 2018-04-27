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
const LibFs = require("fs-extra");
const LibPath = require("path");
const program = require("commander");
const prompt = require("prompt");
const trello_api_1 = require("trello-api");
const Utility = require("./lib/Utility");
const debug = require('debug')('reporter:config');
const pkg = require('../package.json');
program.version(pkg.version)
    .parse(process.argv);
// 交互设计
prompt.start();
prompt.get([
    {
        name: 'title',
        required: true,
        default: 'Report_Title'
    },
    {
        name: 'trello_key',
        required: true,
        default: ''
    },
    {
        name: 'trello_token',
        required: true,
        default: ''
    },
    {
        name: 'trello_memberId',
        required: true,
        default: ''
    },
    {
        name: 'filter_boards',
        required: true,
        default: ''
    },
    {
        name: 'filter_lists',
        required: true,
        default: ''
    },
    {
        name: 'filter_labels',
        required: false,
        default: ''
    }
], (err, input) => {
    CLI.instance().run(input).catch((err) => {
        console.log('err: ', err.message);
    });
});
class CLI {
    static instance() {
        return new CLI();
    }
    run(input) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('CLI start.');
            this._input = input;
            try {
                yield this._validate();
                yield this._save();
            }
            catch (e) {
                throw new Error(e);
            }
            debug('CLI run over.');
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            let trello = new trello_api_1.Trello(this._input.trello_key, this._input.trello_token);
            try {
                yield this._validateToken(trello);
                yield this._validateBoards(trello);
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    _save() {
        return __awaiter(this, void 0, void 0, function* () {
            let settingPath = LibPath.join(__dirname, '..', 'configs', 'setting.json');
            let settings = {
                title: this._input.title,
                trello_key: this._input.trello_key,
                trello_token: this._input.trello_token,
                trello_memberId: this._input.trello_memberId,
                filter_boards: this._input.filter_boards.split(','),
                filter_lists: this._input.filter_lists.split(','),
                filter_labels: this._input.filter_labels.split(','),
            };
            yield LibFs.writeFile(settingPath, Buffer.from(JSON.stringify(settings, null, 2)));
        });
    }
    _validateToken(trello) {
        return __awaiter(this, void 0, void 0, function* () {
            return trello.getTokens(this._input.trello_memberId)
                .then((tokens) => {
                if (Utility.isArray(tokens) && tokens.length > 0) {
                    // do nothing
                }
                else {
                    throw new Error(tokens);
                }
            })
                .catch((err) => {
                throw new Error(err);
            });
        });
    }
    _validateBoards(trello) {
        return __awaiter(this, void 0, void 0, function* () {
            return trello.getBoards(this._input.trello_memberId, { filter: 'open' })
                .then((boards) => {
                if (Utility.isArray(boards) && boards.length > 0) {
                    let boardNames = this._input.filter_boards.split(',');
                    boardNames.forEach((boardName) => {
                        let hasBoardName = false;
                        for (let board of boards) {
                            if (board.name === boardName) {
                                hasBoardName = true;
                                break;
                            }
                        }
                        if (!hasBoardName) {
                            throw new Error(`boardName:${boardName} not found!`);
                        }
                    });
                }
                else {
                    throw new Error('Trello board is empty!');
                }
            })
                .catch((err) => {
                throw new Error(err);
            });
        });
    }
}
