'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const cp = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const request = require("request");
const tmp = require("tmp");
const backend_1 = require("../backend");
const util = require("../util");
let decompress = require('decompress');
const DATA_DIR = {
    darwin: path.join('Library', 'Application Support'),
    win32: path.join('AppData', 'Local'),
    default: path.join('.local', 'share')
};
const PACKAGES_DIR = 'MetaPkg';
const PACKAGES_DIR_PATH = path.join(os.homedir(), DATA_DIR[process.platform] || DATA_DIR.default, PACKAGES_DIR);
const PACKAGES_DB = 'packages.json';
const PACKAGES_DB_PATH = path.join(PACKAGES_DIR_PATH, PACKAGES_DB);
class FallbackBackend extends backend_1.default {
    static get packagesPath() {
        return PACKAGES_DIR_PATH;
    }
    static isUpgradable(basicInfo, packageInfo) {
        let info = util.getInfo(packageInfo);
        return FallbackBackend
            .init()
            .then(() => {
            let versionData = info.version;
            return typeof versionData !== 'string'
                ? util.retrieveLatestVersion(versionData)
                : versionData;
        }).then((latestVersion) => new Promise((resolve) => fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => {
            let installedPackages = jsonObject || {};
            resolve(installedPackages[basicInfo.name]
                && installedPackages[basicInfo.name].version !== latestVersion);
        })));
    }
    static init() {
        return new Promise((resolve) => fs.ensureFile(PACKAGES_DB_PATH, resolve));
    }
    static completePath() {
        let sep = (process.platform === 'win32' ? ';' : ':');
        let packages = {};
        try {
            fs.accessSync(PACKAGES_DB_PATH);
            packages = fs.readJSONSync(PACKAGES_DB_PATH);
        }
        catch (err) { }
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
    packageAvailable(packageInfo) {
        let info = util.getInfo(packageInfo);
        return Promise.resolve(!!(info.source));
    }
    install(basicInfo, packageInfo, outputListener) {
        let info = util.getInfo(packageInfo);
        let packageUrl;
        let version;
        let binaries = [];
        return FallbackBackend
            .init()
            .then(() => {
            let versionData = info.version || basicInfo.version;
            return typeof versionData !== 'string'
                ? util.retrieveLatestVersion(versionData, outputListener)
                : versionData;
        }).then((ver) => {
            outputListener(`Installing ${basicInfo.name} at version ${ver}${os.EOL}`);
            packageUrl = info.source.replace(/%VERSION%/g, ver);
            version = ver;
            return new Promise((resolve) => tmp.file((err, p, fd, cleanup) => resolve(p)));
        }).then((p) => new Promise((resolve) => {
            outputListener('Downloading package...' + os.EOL);
            request.get(packageUrl)
                .pipe(fs.createWriteStream(p))
                .on('close', resolve.bind(null, p));
        })).then((p) => {
            outputListener('Decompressing package...' + os.EOL);
            let packagePath = path.join(PACKAGES_DIR_PATH, basicInfo.name);
            return new Promise((resolve) => fs.remove(packagePath, resolve))
                .then(decompress.bind(null, p, packagePath, { strip: info.strip || 0 }))
                .then(() => packagePath);
        }).then((packagePath) => {
            if (!info.build) {
                return;
            }
            outputListener('Building package...' + os.EOL);
            let batchPromises = Promise.resolve(null);
            info.build.forEach((batch) => {
                batchPromises = batchPromises.then(() => {
                    let commandPromises = [];
                    for (let command in batch) {
                        commandPromises.push(new Promise((resolve) => {
                            cp.exec(command, { cwd: path.join(packagePath, batch[command]) }, resolve);
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
            fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => resolve(jsonObject || {}));
        })).then((installedPackages) => {
            installedPackages[basicInfo.name] = {
                version: version,
                bin: binaries.map((bin) => path.basename(bin))
            };
            return new Promise((resolve) => fs.writeFile(PACKAGES_DB_PATH, JSON.stringify(installedPackages, null, 4), resolve));
        }).then(() => outputListener('Package installed' + os.EOL));
    }
}
exports.default = FallbackBackend;
//# sourceMappingURL=fallback_backend.js.map