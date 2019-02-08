'use strict';

import * as cp from 'child_process';
import Backend from '../backend';
import * as util from '../util';

class ChocolateyBackend extends Backend<string> {
    readonly name = 'chocolatey';
    readonly prettyName = 'Chocolatey';
    readonly command = 'choco';
    readonly platforms = ['win32'];

    async install(basicInfo: util.BasicInfo, packageName: string, outputListener: (data: string) => void) {
        await new Promise((resolve) => {
            cp.spawn('powershell', ['-Command', `Start-Process choco -Verb Runas -ArgumentList 'install --yes ${packageName}' -Wait -WindowStyle Hidden`])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()));
        });
    }
}

export default ChocolateyBackend;