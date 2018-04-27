#!/usr/bin/env node
import * as program from 'commander';

const pkg = require('../package.json');

program.version(pkg.version)
    .command('config [options]', 'Update trello related configuration.')
    .command('gen [options]', 'Generate daily report files and send them by email.')
    .parse(process.argv);