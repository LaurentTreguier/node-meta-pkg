'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const fs = require("fs");
const path = require("path");
const request = require("request");
const sax = require("sax");
function checkExistence(command) {
    let isWin = process.platform === 'win32';
    for (let dir of process.env.PATH.split(isWin ? ';' : ':')) {
        for (let extension of [''].concat(isWin ? ['.exe', '.bat', '.cmd'] : [])) {
            try {
                fs.accessSync(path.join(dir, command + extension), fs.constants.X_OK);
                return true;
            }
            catch (e) { }
        }
    }
    return !command;
}
exports.checkExistence = checkExistence;
function getInfo(packageInfo) {
    let platformInfo = packageInfo[process.platform];
    let info = (typeof platformInfo !== 'string') ? platformInfo || {} : { source: platformInfo };
    return Object.assign({}, packageInfo, info);
}
exports.getInfo = getInfo;
function retrieveLatestVersion(version, outputListener) {
    if (outputListener) {
        outputListener('Fetching version number...' + os.EOL);
    }
    return new Promise((resolve) => {
        request.get(version.feed, (err, message, body) => resolve(body));
    }).then((feed) => {
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
    });
}
exports.retrieveLatestVersion = retrieveLatestVersion;
//# sourceMappingURL=util.js.map