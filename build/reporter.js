#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const pkg = require('../package.json');
program.version(pkg.version)
    .command('config [options]', 'Update trello related configuration.')
    .command('build [options]', 'Generate daily report files and send them by email.')
    .parse(process.argv);
