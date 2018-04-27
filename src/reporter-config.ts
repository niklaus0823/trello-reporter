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
    mail_send: string;
    mail_from: string;
    mail_to: string;
    mail_username: string;
    mail_password: string;
    mail_smtp: string;
}

program.version(pkg.version)
    .parse(process.argv);

let settingPath = LibPath.join(__dirname, '..', 'configs', 'setting.json');
let setting: Utility.SettingSchema;
try {
    setting = Utility.getSetting(settingPath);
} catch (e) {
    setting = {
        title: 'DailyReport',
        trello_key: '',
        trello_token: '',
        trello_memberId: '',
        filter_boards: [],
        filter_lists: [],
        filter_labels: [],
        mail_send: 'false',
        mail_from: '',
        mail_to: '',
        mail_username: '',
        mail_password: '',
        mail_smtp: ''
    };
}

// 交互设计
prompt.start();
prompt.get([
    {
        name: 'title',
        required: true,
        default: setting.title
    },
    {
        name: 'trello_key',
        required: true,
        default: setting.trello_key
    },
    {
        name: 'trello_token',
        required: true,
        default: setting.trello_token
    },
    {
        name: 'trello_memberId',
        required: true,
        default: setting.trello_memberId
    },
    {
        name: 'filter_boards',
        required: true,
        default: setting.filter_boards.join(',')
    },
    {
        name: 'filter_lists',
        required: false,
        default: setting.filter_lists.join(',')
    },
    {
        name: 'filter_labels',
        required: false,
        default: setting.filter_labels.join(',')
    },
    {
        name: 'mail_send',
        required: true,
        default: setting.mail_send,
        conform: (value) => (value === 'true' || value === 'false')
    },
    {
        name: 'mail_from',
        required: false,
        default: setting.mail_from,
    },
    {
        name: 'mail_to',
        required: false,
        default: setting.mail_to,
    },
    {
        name: 'mail_username',
        required: false,
        default: setting.mail_username,
    },
    {
        name: 'mail_password',
        required: false,
        default: setting.mail_password,
    },
    {
        name: 'mail_smtp',
        required: false,
        default: setting.mail_smtp,
    },
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
        let settings = {
            title: this._input.title,
            trello_key: this._input.trello_key,
            trello_token: this._input.trello_token,
            trello_memberId: this._input.trello_memberId,
            filter_boards: this._input.filter_boards.split(','),
            filter_lists: this._input.filter_lists.split(','),
            filter_labels: this._input.filter_labels.split(','),
            mail_send: this._input.mail_send,
            mail_from: this._input.mail_from,
            mail_to: this._input.mail_to,
            mail_username: this._input.mail_username,
            mail_password: this._input.mail_password,
            mail_smtp: this._input.mail_smtp,
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