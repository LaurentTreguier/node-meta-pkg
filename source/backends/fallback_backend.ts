'use strict';

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request';
import * as sax from 'sax';
import * as tmp from 'tmp';
import Backend from '../backend';
let decompress = require('decompress');

let decompressPlugins = ['unzip', 'tar', 'tarbz2', 'targz', 'tarxz']
    .map((type) => require('decompress-' + type)());

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

abstract class Info {
    source?: string;
    version?: string | FeedVersion;
    bin?: string | string[];
    strip?: number;
}

abstract class FeedVersion {
    feed: string;
    regexp: string | RegExp;
}

class FallbackBackend extends Backend<any> {
    static init() {
        return new Promise((resolve) => fs.ensureFile(PACKAGES_DB_PATH, resolve));
    }

    static get packagesPath() {
        return PACKAGES_DIR_PATH;
    }

    static isUpgradable(packageInfo: any) {
        let info = FallbackBackend.getInfo(packageInfo);

        return FallbackBackend
            .init()
            .then(() => {
                let versionData = info.version
                return versionData instanceof FeedVersion
                    ? FallbackBackend.retrieveLatestVersion(versionData)
                    : versionData;
            }).then((latestVersion) => new Promise((resolve) =>
                fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => {
                    let installedPackages = jsonObject || {};
                    resolve(installedPackages[packageInfo.name].version !== latestVersion);
                })));
    }

    private static completePath() {
        let sep = (process.platform === 'win32' ? ';' : ':');
        let packages = fs.readJSONSync(PACKAGES_DB_PATH);

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
        let info: Info = platformInfo instanceof Info ? platformInfo : { source: platformInfo };

        info.source = info.source || packageInfo.source;
        info.version = info.version || packageInfo.version;
        info.bin = info.bin || packageInfo.bin;
        info.strip = info.strip || packageInfo.strip;

        return info;
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
                let matches: string[] = [];

                parser.ontext = (text) => {
                    let match = text.match(version.regexp instanceof RegExp
                        ? version.regexp
                        : new RegExp(version.regexp));

                    if (match) {
                        matches.push(match[1]);
                    }
                };

                parser.onend = () => {
                    resolve(matches.reduce((previous, current) =>
                        previous > current ? previous : current
                    ))
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
        return Promise.resolve(!!packageInfo[process.platform]);
    }

    install(packageInfo: any, outputListener: (data: string) => void) {
        let info: Info = FallbackBackend.getInfo(packageInfo);
        let packageUrl: string;
        let version: string;
        let binaries: string[] = [];

        return FallbackBackend
            .init()
            .then(() => {
                let versionData = info.version
                return versionData instanceof Object
                    ? FallbackBackend.retrieveLatestVersion(<FeedVersion>versionData, outputListener)
                    : versionData;
            }).then((ver: string) => {
                outputListener(`Installing ${packageInfo.name} at version ${ver}\n`);
                packageUrl = info.source.replace(/%VERSION%/g, ver);
                version = ver;
            }).then(() => new Promise((resolve) => tmp.file((err, p, fd, cleanup) => resolve(p))))
            .then((p: string) => new Promise((resolve) => {
                outputListener('Downloading package...\n');
                request.get(packageUrl)
                    .pipe(fs.createWriteStream(p))
                    .on('close', resolve.bind(null, p));
            })).then((p: string) => {
                outputListener('Decompressing package...\n');
                let packagePath = path.join(PACKAGES_DIR_PATH, packageInfo.name);
                return new Promise((resolve) => fs.remove(packagePath, resolve))
                    .then(decompress.bind(null, p, packagePath,
                        {
                            plugins: decompressPlugins,
                            strip: info.strip || 0
                        }));
            }).then(() => {
                let bin = info.bin;
                if (!info.bin) {
                    return;
                }

                binaries = info.bin instanceof Array ? info.bin : [info.bin];
                FallbackBackend.completePath();
            }).then(() => new Promise((resolve) => {
                outputListener('Registering package...\n');
                fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) =>
                    resolve(jsonObject || {}));
            })).then((installedPackages) => {
                installedPackages[packageInfo.name] = {
                    version: version,
                    bin: binaries.map((bin) => path.basename(bin))
                };

                return new Promise((resolve) =>
                    fs.writeFile(PACKAGES_DB_PATH, JSON.stringify(installedPackages, null, 4), resolve));
            }).then(() => outputListener('Package installed\n'));
    }
}

export default FallbackBackend;