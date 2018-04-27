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
const iterable_readfiles_1 = require("iterable-readfiles");
/**
 * Find project dir
 *
 * @returns {string}
 */
exports.getProjectDir = () => {
    return process.cwd();
};
exports.ucFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.lcFirst = (str) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
};
/**
 * Find absolute filepath and add '/' at dir path last string
 *
 * @returns {string}
 */
function getAbsolutePath(relativePath) {
    let path = LibPath.join(exports.getProjectDir(), LibPath.normalize(relativePath));
    let pathStat = LibFs.statSync(path);
    if (pathStat.isDirectory() && path.substr(path.length - 1, 1) != '/') {
        path = LibPath.join(path, '/');
    }
    return path;
}
exports.getAbsolutePath = getAbsolutePath;
/**
 * 读取文件夹内指定类型文件
 *
 * @param {string} dir
 * @param {string} extname
 * @param {Array<string>} excludes
 * @returns {Promise<Array<string>>}
 */
exports.readFiles = function (dir, extname, excludes) {
    return __awaiter(this, void 0, void 0, function* () {
        let ignoreFunction = (path, stat) => {
            return exports.shallIgnore(path, excludes, (stat.isFile() && LibPath.extname(path) !== `.${extname}`));
        };
        let ignores = ['.DS_Store', '.git', '.idea', ignoreFunction];
        return iterable_readfiles_1.readfiles(dir, ignores);
    });
};
exports.shallIgnore = function (path, excludes, defaultValue) {
    let shallIgnore = defaultValue || false;
    if (shallIgnore) {
        return shallIgnore;
    }
    if (excludes !== null && excludes.length > 0) {
        excludes.forEach((exclude) => {
            if (path.indexOf(LibPath.normalize(exclude)) !== -1) {
                shallIgnore = true;
            }
        });
    }
    return shallIgnore;
};
/**
 * Object Validate
 *
 * @param {boolean} value
 * @returns {boolean}
 */
function isObject(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}
/**
 * ArrayObject Validate
 *
 * @param {boolean} value
 * @returns {boolean}
 */
function isArray(value) {
    return value !== null && isObject(value) && isLength(value.length);
}
exports.isArray = isArray;
/**
 * LengthNumber Validate
 *
 * @param {boolean} value
 * @returns {boolean}
 */
function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= 9007199254740991;
}
exports.isLength = isLength;
/**
 * Get setting.json object
 *
 * @param {string} path
 * @returns {SettingSchema}
 */
function getSetting(path) {
    return JSON.parse(LibFs.readFileSync(path).toString());
}
exports.getSetting = getSetting;
function dateToString(timestamp, noLodash) {
    if (timestamp === '') {
        return timestamp;
    }
    // if (typeof timestamp == 'string') {
    //     let date = new Date(timestamp);
    //     if (date == 'Invalid Date') return '';
    // }
    //
    // var year = date.getFullYear();
    // var month = date.getMonth() + 1;
    // if (month < 10) {
    //     month = '0' + month;
    // }
    // var day = date.getDate();
    // if (day < 10) {
    //     day = '0' + day;
    // }
    //
    // if (noLodash == true) {
    //     return year + '' + month + '' + day;
    // } else {
    //     return year + '-' + month + '-' + day;
    // }
}
exports.dateToString = dateToString;
