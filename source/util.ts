'use strict';

import * as fs from 'fs';
import * as path from 'path';

export function checkExistence(command: string) {
    let isWin = process.platform === 'win32';
    let exists = false;

    process.env.PATH.split(isWin ? ';' : ':').forEach((dir) => {
        for (let extension of [''].concat(isWin ? ['.exe', '.bat', '.cmd'] : [])) {
            try {
                fs.accessSync(path.join(dir, command + extension), fs.constants.F_OK);
                exists = true;
                break;
            } catch (e) { }
        }
    });

    return exists || !command;
}