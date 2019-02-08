'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const fs = require("fs");
const path = require("path");
const request = require("request");
const sax = require("sax");
function checkExistence(command) {
    let isWin = process.platform === 'win32';
    if (!command) {
        return true;
    }
    for (let dir of process.env.PATH.split(isWin ? ';' : ':')) {
        for (let extension of [''].concat(isWin ? ['.exe', '.bat', '.cmd'] : [])) {
            try {
                fs.accessSync(path.join(dir, command + extension), fs.constants.X_OK);
                return true;
            }
            catch (e) { }
        }
    }
    return false;
}
exports.checkExistence = checkExistence;
function getInfo(packageInfo) {
    let platformInfo = packageInfo[process.platform];
    let info = (typeof platformInfo !== 'string') ? platformInfo || {} : { source: platformInfo };
    return Object.assign({}, packageInfo, info);
}
exports.getInfo = getInfo;
function retrieveLatestVersion(version, outputListener) {
    return __awaiter(this, void 0, void 0, function* () {
        if (outputListener) {
            outputListener('Fetching version number...' + os.EOL);
        }
        try {
            const feed = yield new Promise((resolve) => {
                request.get(version.feed, (err, message, body) => resolve(body.toString()));
            });
            let parser = sax.parser(false, null);
            return new Promise((resolve) => {
                let matches = [];
                parser.ontext = (text) => {
                    let match = text.match(typeof version.regexp !== 'string'
                        ? version.regexp
                        : new RegExp(version.regexp));
                    if (match) {
                        matches.push(match[1]);
                    }
                };
                parser.onend = () => {
                    resolve(matches.reduce((previous, current) => previous > current ? previous : current));
                };
                parser.write(feed).end();
            });
        }
        catch (err) {
            return '';
        }
    });
}
exports.retrieveLatestVersion = retrieveLatestVersion;
//# sourceMappingURL=util.js.map