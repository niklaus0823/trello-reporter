import * as program from 'commander';

const debug = require('debug')('reporter:build');
const pkg = require('../package.json');

program.version(pkg.version)
    .parse(process.argv);

class CLI {

    static instance() {
        return new CLI();
    }

    public async run() {
        debug('CLI start.');

        await this._validate();

        debug('CLI run over.');
    }

    private async _validate() {

    }
}

CLI.instance().run().catch((err: Error) => {
    console.log('err: ', err.message);
});