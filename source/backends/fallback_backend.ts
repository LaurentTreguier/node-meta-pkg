'use strict';

import * as os from 'os';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request';
import * as tmp from 'tmp';
import Backend from '../backend';
import * as util from '../util';
let decompress = require('decompress');

const DATA_DIR = {
    darwin: path.join('Library', 'Application Support'),
    win32: path.join('AppData', 'Local'),
    default: path.join('.local', 'share')
};

const PACKAGES_DIR = 'MetaPkg';
const PACKAGES_DIR_PATH = path.join(os.homedir(),
    DATA_DIR[process.platform] || DATA_DIR.default,
    PACKAGES_DIR);
const PACKAGES_DB = 'packages.json';
const PACKAGES_DB_PATH = path.join(PACKAGES_DIR_PATH, PACKAGES_DB);

interface Info {
    source?: string;
    version?: string | util.FeedVersion;
    build?: Array<any>;
    bin?: string | string[];
    strip?: number;
}

class FallbackBackend extends Backend<any> {
    static get packagesPath(): string {
        return PACKAGES_DIR_PATH;
    }

    static async isUpgradable(basicInfo: util.BasicInfo, packageInfo: any): Promise<boolean> {
        let info = util.getInfo(packageInfo);

        await FallbackBackend.init();
        let versionData = info.version;
        const latestVersion = typeof versionData !== 'string'
            ? await util.retrieveLatestVersion(versionData)
            : versionData;
        return await new Promise<boolean>((resolve) => fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => {
            let installedPackages = jsonObject || {};
            resolve(!installedPackages[basicInfo.name]
                || installedPackages[basicInfo.name].version !== latestVersion);
        }));
    }

    private static init(): Promise<any> {
        return new Promise((resolve) => fs.ensureFile(PACKAGES_DB_PATH, resolve));
    }

    private static completePath() {
        let sep = (process.platform === 'win32' ? ';' : ':');
        let packages = {};

        try {
            fs.accessSync(PACKAGES_DB_PATH);
            packages = fs.readJSONSync(PACKAGES_DB_PATH);
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

    constructor() {
        super();
        FallbackBackend.completePath();
    }

    readonly name = 'fallback';
    readonly prettyName = 'Local install';
    readonly command = '';
    readonly platforms = ['darwin', 'freebsd', 'linux', 'win32'];

    async packageAvailable(packageInfo: any) {
        let info = util.getInfo(packageInfo);
        return !!info.source;
    }

    async install(basicInfo: util.BasicInfo, packageInfo: any, outputListener: (data: string) => void) {
        let info: Info = util.getInfo(packageInfo);
        let packageUrl: string;
        let version: string;
        let binaries: string[] = [];

        await FallbackBackend
            .init();
        let versionData = info.version || basicInfo.version;
        const ver = typeof versionData !== 'string'
            ? await util.retrieveLatestVersion(versionData, outputListener)
            : versionData;

        outputListener(`Installing ${basicInfo.name} at version ${ver}${os.EOL}`);
        packageUrl = info.source.replace(/%VERSION%/g, ver);
        version = ver;
        const p = await new Promise<string>((resolve) => tmp.file((err, p, fd, cleanup) => resolve(p)));

        await new Promise((resolve) => {
            outputListener('Downloading package...' + os.EOL);
            request.get(packageUrl)
                .pipe(fs.createWriteStream(p))
                .on('close', resolve);
        });

        outputListener('Decompressing package...' + os.EOL);
        let packagePath = path.join(PACKAGES_DIR_PATH, basicInfo.name);

        await new Promise((resolve) => fs.remove(packagePath, resolve))
            .then(decompress.bind(null, p, packagePath, { strip: info.strip || 0 }))
            .then(() => packagePath);

        if (info.build) {
            outputListener('Building package...' + os.EOL);
            let batchPromises = Promise.resolve(null);

            info.build.forEach((batch) => {
                batchPromises = batchPromises.then(() => {
                    let commandPromises: Promise<any>[] = [];

                    for (let command in batch) {
                        commandPromises.push(new Promise((resolve) => {
                            cp.exec(command, { cwd: path.join(packagePath, batch[command]) }, resolve);
                        }));
                    }

                    return Promise.all(commandPromises);
                });
            });

            await batchPromises;
        }

        if (info.bin) {
            binaries = typeof info.bin !== 'string' ? info.bin : [info.bin];
            FallbackBackend.completePath();
        }

        const installedPackages = await new Promise((resolve) => {
            outputListener('Registering package...' + os.EOL);
            fs.readJSON(PACKAGES_DB_PATH, (err, jsonObject) => resolve(jsonObject || {}));
        });

        installedPackages[basicInfo.name] = {
            version: version,
            bin: binaries.map((bin) => path.basename(bin))
        };

        await new Promise((resolve) => fs.writeFile(PACKAGES_DB_PATH, JSON.stringify(installedPackages, null, 4), resolve));
        return outputListener('Package installed' + os.EOL);
    }
}

export default FallbackBackend;