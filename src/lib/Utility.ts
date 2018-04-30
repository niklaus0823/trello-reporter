import * as LibFs from 'fs-extra';
import * as LibPath from 'path';
import {readfiles, IgnoreType, IgnoreFunction} from 'iterable-readfiles';

export interface SettingSchema {
    title: string;
    trello_key: string;
    trello_token: string;
    trello_memberId: string;
    filter_boards: Array<string>; // 列出指定 boardName 下的相关信息，不允许位空
    filter_lists: Array<string>; // 列出指定 listName 下的相关信息，允许为空，代表所有 list
    filter_labels: Array<string>; // 列出指定 labels 相等的 card，允许为空，代表所有 card
    mail_send: string;
    mail_from: string;
    mail_to: string;
    mail_username: string;
    mail_password: string;
    mail_smtp: string;
}

/**
 * Find project dir
 *
 * @returns {string}
 */
export const getProjectDir = (): string => {
    return process.cwd();
};

export const ucFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const lcFirst = (str: string): string => {
    return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Find absolute filepath and add '/' at dir path last string
 *
 * @returns {string}
 */
export function getAbsolutePath(relativePath: string): string {
    let path = LibPath.join(getProjectDir(), LibPath.normalize(relativePath));
    let pathStat = LibFs.statSync(path);
    if (pathStat.isDirectory() && path.substr(path.length - 1, 1) != '/') {
        path = LibPath.join(path, '/');
    }
    return path;
}

/**
 * 读取文件夹内指定类型文件
 *
 * @param {string} dir
 * @param {string} extname
 * @param {Array<string>} excludes
 * @returns {Promise<Array<string>>}
 */
export const readFiles = async function (dir: string, extname: string, excludes?: Array<string>): Promise<Array<string>> {
    let ignoreFunction: IgnoreFunction = (path: string, stat: LibFs.Stats): boolean => {
        return shallIgnore(path, excludes, (stat.isFile() && LibPath.extname(path) !== `.${extname}`));
    };
    let ignores: Array<IgnoreType> = ['.DS_Store', '.git', '.idea', ignoreFunction];
    return readfiles(dir, ignores);
};

export const shallIgnore = function (path: string, excludes?: Array<string>, defaultValue?: boolean): boolean {
    let shallIgnore = defaultValue || false;
    if (shallIgnore) {
        return shallIgnore;
    }

    if (excludes !== null && excludes.length > 0) {
        excludes.forEach((exclude: string) => {
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
export function isArray(value: any): boolean {
    return value !== null && isObject(value) && isLength(value.length);
}


/**
 * LengthNumber Validate
 *
 * @param {boolean} value
 * @returns {boolean}
 */
export function isLength(value: any): boolean {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= 9007199254740991;
}

/**
 * Get setting.json object
 *
 * @param {string} path
 * @returns {SettingSchema}
 */
export function getSetting(path: string): SettingSchema {
    return JSON.parse(LibFs.readFileSync(path).toString());
}


export function dateToString(date: Date, noLodash?: boolean): string {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let monthPrefix = (month < 10) ? '0' : '';
    let day = date.getDate();
    let dayPrefix = (day < 10) ? '0' : '';
    if (noLodash == true) {
        return year + '' + monthPrefix + month + '' + dayPrefix + day;
    } else {
        return year + '-' + monthPrefix + month + '-' + dayPrefix + day;
    }
}