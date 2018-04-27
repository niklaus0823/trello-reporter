import * as LibFs from 'fs-extra';
import * as LibPath from 'path';
import * as program from 'commander';
import * as prompt from 'prompt';
import {Trello, TokensSchema, BoardSchema} from 'trello-api';
import * as Utility from './lib/Utility';

const debug = require('debug')('reporter:config');
const pkg = require('../package.json');

interface PromptInput {
    title: string;
    trello_key: string;
    trello_token: string;
    trello_memberId: string;
    filter_boards: string;
    filter_lists: string;
    filter_labels: string;
}

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
], (err, input: PromptInput) => {
    CLI.instance().run(input).catch((err: Error) => {
        console.log('err: ', err.message);
    });
});

class CLI {

    private _input: PromptInput;

    static instance() {
        return new CLI();
    }

    public async run(input: PromptInput) {
        debug('CLI start.');

        this._input = input;

        try {
            await this._validate();
            await this._save();
        } catch (e) {
            throw new Error(e);
        }

        debug('CLI run over.');
    }

    private async _validate() {
        let trello = new Trello(this._input.trello_key, this._input.trello_token);

        try {
            await this._validateToken(trello);
            await this._validateBoards(trello);
        } catch (e) {
            throw new Error(e);
        }
    }

    private async _save() {
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

        await LibFs.writeFile(settingPath, Buffer.from(JSON.stringify(settings, null, 2)));
    }

    private async _validateToken(trello: Trello) {
        return trello.getTokens(this._input.trello_memberId)
            .then((tokens: Array<TokensSchema>) => {
                if (Utility.isArray(tokens) && tokens.length > 0) {
                    // do nothing
                } else {
                    throw new Error(tokens as any);
                }
            })
            .catch((err) => {
                throw new Error(err);
            });
    }

    private async _validateBoards(trello: Trello) {
        return trello.getBoards(this._input.trello_memberId, {filter: 'open'})
            .then((boards: Array<BoardSchema>) => {
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
                } else {
                    throw new Error('Trello board is empty!');
                }
            })
            .catch((err) => {
                throw new Error(err);
            });
    }
}
