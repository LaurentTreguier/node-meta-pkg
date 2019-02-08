'use strict';

import * as cp from 'child_process';
import Backend from '../backend';
import * as util from '../util';

class BrewBackend extends Backend<string> {
    readonly name = 'brew';
    readonly prettyName = 'Brew';
    readonly command = 'brew';
    readonly platforms = ['darwin', 'linux'];

    async install(basicInfo: util.BasicInfo, packageName: string, outputListener: (data: string) => void) {
        await new Promise((resolve) => {
            cp.spawn(this.command, ['install', packageName])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()));
        });
    }
}

export default BrewBackend;