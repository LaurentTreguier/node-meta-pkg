'use strict';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as sax from 'sax';

export interface BasicInfo {
    name: string;
    version?: string | FeedVersion;
}

export interface FeedVersion {
    feed: string;
    regexp: string | RegExp;
}

export function checkExistence(command: string) {
    let isWin = process.platform === 'win32';

    if (!command) {
        return false;
    }

    for (let dir of process.env.PATH.split(isWin ? ';' : ':')) {
        for (let extension of [''].concat(isWin ? ['.exe', '.bat', '.cmd'] : [])) {
            try {
                fs.accessSync(path.join(dir, command + extension), fs.constants.X_OK);
                return true;
            } catch (e) { }
        }
    }
}

export function getInfo(packageInfo: any) {
    let platformInfo: string | any = packageInfo[process.platform];
    let info: any = (typeof platformInfo !== 'string') ? platformInfo || {} : { source: platformInfo };

    return Object.assign({}, packageInfo, info);
}

export function retrieveLatestVersion(version: FeedVersion, outputListener?: (data: string) => void) {
    if (outputListener) {
        outputListener('Fetching version number...' + os.EOL);
    }

    return new Promise((resolve) => {
        request.get(version.feed, (err, message, body) => resolve(body));
    }).then((feed: string) => {
        let parser = sax.parser(false, null);

        return new Promise<string>((resolve) => {
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
    }).catch((err) => '');
}