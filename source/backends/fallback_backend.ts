'use strict';

import * as os from 'os';
import * as cp from 'child_process';
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
const PACKAGES_DB = 'packages.json';
const PACKAGES_DB_PATH = path.join(PACKAGES_DIR_PATH, PACKAGES_DB);

interface Info {
    source?: string;
    version?: string | FeedVersion;
    build?: Array<any>;
    bin?: string | string[];
    strip?: number;
}

interface FeedVersion {
    feed: string;
    regexp: string | RegExp;
}

class FallbackBackend extends Backend<any> {
    static init(): PromiseLike<any> {
        return new Promise((resolve) => fs.ensureFile(PACKAGES_DB_PATH, resolve));
    }

    static get packagesPath(): string {
        return PACKAGES_DIR_PATH;
    }

    static isUpgradable(name: string, packageInfo: any): PromiseLike<boolean> {
        let info = FallbackBackend.getInfo(packageInfo);

        return FallbackBackend
            .init()
            .then(() => {
                let versionData = info.version
                return typeof versionData !== 'string'
                    ? FallbackBackend.retrieveLatestVersion(versionData)
                    : versionData;
            }).then((latestVersion) => new Promise((resolve) =>
                fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => {
                    let installedPackages = jsonObject || {};
                    resolve(installedPackages[name]
                        && installedPackages[name].version !== latestVersion);
                })));
    }

    private static completePath() {
        let sep = (process.platform === 'win32' ? ';' : ':');
        let packages = [];

        try {
            fs.accessSync(PACKAGES_DB_PATH);
            fs.readJSONSync(PACKAGES_DB_PATH);
        } catch (err) { }

        for (let name in packages) {
            if (packages[name].bin) {
                packages[name].bin.forEach((bin) => {
                    let binPath = path.join(PACKAGES_DIR_PATH, name, bin);

                    if (process.env.PATH.indexOf(binPath) === -1) {
                        process.env.PATH += sep + binPath;
                    }
                });
            }
        }
    }

    private static getInfo(packageInfo: any) {
        let platformInfo: string | Info = packageInfo[process.platform];
        let info: Info = (typeof platformInfo !== 'string') ? platformInfo || {} : { source: platformInfo };

        info.source = info.source || packageInfo.source;
        info.version = info.version || packageInfo.version;
        info.build = info.build || packageInfo.build;
        info.bin = info.bin || packageInfo.bin;
        info.strip = info.strip || packageInfo.strip;

        return info;
    }

    private static retrieveLatestVersion(version: FeedVersion, outputListener?: (data: string) => void) {
        if (outputListener) {
            outputListener('Fetching version number...' + os.EOL);
        }

        return new Promise((resolve) => {
            request.get(version.feed, (err, message, body) => resolve(body));
        }).then((feed: string) => {
            let parser = sax.parser(false, null);

            return new Promise((resolve) => {
                let matches: string[] = [];

                parser.ontext = (text) => {
                    let match = text.match(typeof version.regexp !== 'string'
                        ? version.regexp
                        : new RegExp(version.regexp));

                    if (match) {
                        matches.push(match[1]);
                    }
                };

                parser.onend = () => {
                    resolve(matches.reduce((previous, current) =>
                        previous > current ? previous : current
                    ));
                };

                parser.write(feed).end();
            });
        });
    }

    constructor() {
        super();
        FallbackBackend.completePath();
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
        let info = FallbackBackend.getInfo(packageInfo);
        return Promise.resolve(!!(info.source && info.version));
    }

    install(name: string, packageInfo: any, outputListener: (data: string) => void) {
        let info: Info = FallbackBackend.getInfo(packageInfo);
        let packageUrl: string;
        let version: string;
        let binaries: string[] = [];

        return FallbackBackend
            .init()
            .then(() => {
                let versionData = info.version
                return typeof versionData !== 'string'
                    ? FallbackBackend.retrieveLatestVersion(versionData, outputListener)
                    : versionData;
            }).then((ver: string) => {
                outputListener(`Installing ${name} at version ${ver}${os.EOL}`);
                packageUrl = info.source.replace(/%VERSION%/g, ver);
                version = ver;
            }).then(() => new Promise((resolve) => tmp.file((err, p, fd, cleanup) => resolve(p))))
            .then((p: string) => new Promise((resolve) => {
                outputListener('Downloading package...' + os.EOL);
                request.get(packageUrl)
                    .pipe(fs.createWriteStream(p))
                    .on('close', resolve.bind(null, p));
            })).then((p: string) => {
                outputListener('Decompressing package...' + os.EOL);
                let packagePath = path.join(PACKAGES_DIR_PATH, name);
                return new Promise((resolve) => fs.remove(packagePath, resolve))
                    .then(decompress.bind(null, p, packagePath, { strip: info.strip || 0 }))
                    .then(() => packagePath);
            }).then((packagePath: string) => {
                if (!info.build) {
                    return;
                }

                outputListener('Building package...' + os.EOL);
                let batchPromises = Promise.resolve(null);

                info.build.forEach((batch) => {
                    batchPromises = batchPromises.then(() => {
                        let commandPromises: Promise<any>[] = [];

                        for (let command in batch) {
                            commandPromises.push(new Promise((resolve) => {
                                cp.exec(command,
                                    { cwd: path.join(packagePath, batch[command]) },
                                    resolve);
                            }));
                        }

                        return Promise.all(commandPromises);
                    });
                });

                return batchPromises;
            }).then(() => {
                if (!info.bin) {
                    return;
                }

                binaries = typeof info.bin !== 'string' ? info.bin : [info.bin];
                FallbackBackend.completePath();
            }).then(() => new Promise((resolve) => {
                outputListener('Registering package...' + os.EOL);
                fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) =>
                    resolve(jsonObject || {}));
            })).then((installedPackages) => {
                installedPackages[name] = {
                    version: version,
                    bin: binaries.map((bin) => path.basename(bin))
                };

                return new Promise((resolve) =>
                    fs.writeFile(PACKAGES_DB_PATH, JSON.stringify(installedPackages, null, 4), resolve));
            }).then(() => outputListener('Package installed' + os.EOL));
    }
}

export default FallbackBackend;