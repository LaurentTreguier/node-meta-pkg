'use strict';

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request';
import * as sax from 'sax';
import * as tmp from 'tmp';
import Backend from '../backend';
let decompress = require('decompress');

const DATA_DIR = {
    darwin: 'Library/Application Support',
    win32: 'AppData/Roaming',
    default: '.local/share'
};

const PACKAGES_DIR = 'MetaPkg';
const PACKAGES_DIR_PATH = path.join(os.homedir(),
    DATA_DIR[process.platform] || DATA_DIR.default,
    PACKAGES_DIR);
const PACKAGES_BIN = '.bin';
const PACKAGES_BIN_PATH = path.join(PACKAGES_DIR_PATH, PACKAGES_BIN);
const PACKAGES_DB = 'packages.json';
const PACKAGES_DB_PATH = path.join(PACKAGES_DIR_PATH, PACKAGES_DB);

interface Info {
    source: string;
    version: string | FeedVersion;
    bin?: string | string[];
}

interface FeedVersion {
    feed: string;
    regexp: RegExp;
}

class FallbackBackend extends Backend<any> {
    static init() {
        return new Promise((resolve) => fs.ensureFile(PACKAGES_DB_PATH, resolve))
            .then(() => new Promise((resolve) => fs.ensureDir(PACKAGES_BIN_PATH, resolve)));
    }

    static get packagesPath() {
        return PACKAGES_DIR_PATH;
    }

    static isUpgradable(packageInfo: any) {
        let info: Info = packageInfo[process.platform];

        if (!info) {
            return Promise.resolve(false);
        }

        let versionData = info.version || packageInfo.version;

        return Promise.resolve(versionData instanceof Object
            ? FallbackBackend.retrieveLatestVersion(<FeedVersion>versionData)
            : versionData)
            .then((latestVersion) => new Promise((resolve) =>
                fs.readFile(PACKAGES_DB_PATH, (err, data) => {
                    let installedPackages = JSON.parse(data.toString());
                    resolve(installedPackages[packageInfo.name].version !== latestVersion);
                })));
    }

    constructor() {
        super();
        let sep = (process.platform === 'win32' ? ';' : ':');
        process.env.PATH += sep + PACKAGES_BIN_PATH;
    }

    get name() {
        return 'fallback';
    }

    get prettyName() {
        return 'Local install';
    }

    get command() {
        return null;
    }

    get platforms() {
        return ['darwin', 'freebsd', 'linux', 'win32'];
    }

    packageAvailable(packageInfo: any) {
        return !!packageInfo[process.platform];
    }

    install(packageInfo: any, outputListener: (data: string) => void) {
        let info: Info = packageInfo[process.platform];
        let packageUrl: string;
        let version: string;
        let binaries: string[];

        return FallbackBackend
            .init()
            .then(() => {
                let versionData = info.version || packageInfo.version
                return versionData instanceof Object
                    ? FallbackBackend.retrieveLatestVersion(<FeedVersion>versionData, outputListener)
                    : versionData;
            }).then((ver: string) => {
                outputListener(`Installing ${packageInfo.name} at version ${ver}\n`);
                packageUrl = info.source.replace(/%VERSION%/g, ver);
                version = ver;
            }).then(() => new Promise((resolve) =>
                tmp.file((err, p, fd, cleanup) => resolve(p))))
            .then((p: string) => new Promise((resolve) => {
                outputListener('Downloading package...\n');
                request.get(packageUrl)
                    .pipe(fs.createWriteStream(p))
                    .on('close', resolve.bind(null, p));
            })).then((p: string) => {
                outputListener('Decompressing package...\n');
                return decompress(p, path.join(PACKAGES_DIR_PATH, packageInfo.name));
            }).then(() => {
                if (!info.bin) {
                    return;
                }

                outputListener('Linking binaries...\n');
                binaries = info.bin instanceof Array ? info.bin : [info.bin];

                return Promise.all(binaries.map((bin) => new Promise((resolve) =>
                    fs.link(path.join(PACKAGES_DIR_PATH, packageInfo.name, bin),
                        path.join(PACKAGES_BIN_PATH, bin),
                        resolve))));
            }).then(() => new Promise((resolve) => {
                outputListener('Registering package...\n');
                fs.readFile(PACKAGES_DB_PATH, (err, data) =>
                    resolve(data.length ? JSON.parse(data.toString()) : {}));
            })).then((installedPackages) => {
                installedPackages[packageInfo.name] = {
                    version: version,
                    bin: binaries
                };

                return new Promise((resolve) =>
                    fs.writeFile(PACKAGES_DB_PATH, JSON.stringify(installedPackages, null, 4), resolve));
            }).then(() => outputListener('Package installed\n'));
    }

    private static retrieveLatestVersion(version: FeedVersion, outputListener?: (data: string) => void) {
        if (outputListener) {
            outputListener('Fetching version number...\n');
        }

        return new Promise((resolve) => {
            request.get(version.feed, (err, message, body) => resolve(body));
        }).then((feed: string) => {
            let parser = sax.parser(false, null);

            return new Promise((resolve) => {
                parser.ontext = (text) => {
                    let match = text.match(version.regexp);

                    if (match) {
                        resolve(match[1]);
                    }
                };

                parser.onend = resolve;
                parser.write(feed);
            });
        });
    }
}

export default FallbackBackend;