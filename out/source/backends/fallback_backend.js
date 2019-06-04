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
    constructor() {
        super();
        this.name = 'fallback';
        this.prettyName = 'Local install';
        this.command = '';
        this.platforms = ['darwin', 'freebsd', 'linux', 'win32'];
        FallbackBackend.completePath();
    }
    static get packagesPath() {
        return PACKAGES_DIR_PATH;
    }
    static isUpgradable(basicInfo, packageInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let info = util.getInfo(packageInfo);
            yield FallbackBackend.init();
            let versionData = info.version;
            const latestVersion = typeof versionData !== 'string'
                ? yield util.retrieveLatestVersion(versionData)
                : versionData;
            return yield new Promise((resolve) => fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => {
                let installedPackages = jsonObject || {};
                resolve(installedPackages[basicInfo.name]
                    && installedPackages[basicInfo.name].version !== latestVersion);
            }));
        });
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
    packageAvailable(packageInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let info = util.getInfo(packageInfo);
            return !!info.source;
        });
    }
    install(basicInfo, packageInfo, outputListener) {
        return __awaiter(this, void 0, void 0, function* () {
            let info = util.getInfo(packageInfo);
            let packageUrl;
            let version;
            let binaries = [];
            yield FallbackBackend
                .init();
            let versionData = info.version || basicInfo.version;
            const ver = typeof versionData !== 'string'
                ? yield util.retrieveLatestVersion(versionData, outputListener)
                : versionData;
            outputListener(`Installing ${basicInfo.name} at version ${ver}${os.EOL}`);
            packageUrl = info.source.replace(/%VERSION%/g, ver);
            version = ver;
            const p = yield new Promise((resolve) => tmp.file((err, p, fd, cleanup) => resolve(p)));
            yield new Promise((resolve) => {
                outputListener('Downloading package...' + os.EOL);
                request.get(packageUrl)
                    .pipe(fs.createWriteStream(p))
                    .on('close', resolve);
            });
            outputListener('Decompressing package...' + os.EOL);
            let packagePath = path.join(PACKAGES_DIR_PATH, basicInfo.name);
            yield new Promise((resolve) => fs.remove(packagePath, resolve))
                .then(decompress.bind(null, p, packagePath, { strip: info.strip || 0 }))
                .then(() => packagePath);
            if (info.build) {
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
                yield batchPromises;
            }
            if (info.bin) {
                binaries = typeof info.bin !== 'string' ? info.bin : [info.bin];
                FallbackBackend.completePath();
            }
            const installedPackages = yield new Promise((resolve) => {
                outputListener('Registering package...' + os.EOL);
                fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => resolve(jsonObject || {}));
            });
            installedPackages[basicInfo.name] = {
                version: version,
                bin: binaries.map((bin) => path.basename(bin))
            };
            yield new Promise((resolve) => fs.writeFile(PACKAGES_DB_PATH, JSON.stringify(installedPackages, null, 4), resolve));
            return outputListener('Package installed' + os.EOL);
        });
    }
}
exports.default = FallbackBackend;
//# sourceMappingURL=fallback_backend.js.map