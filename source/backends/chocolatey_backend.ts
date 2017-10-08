'use strict';

import * as cp from 'child_process';
import Backend from '../backend';
import * as util from '../util';

class ChocolateyBackend extends Backend<string> {
    get name() {
        return 'chocolatey';
    }

    get prettyName() {
        return 'Chocolatey';
    }

    get command() {
        return 'choco';
    }

    get platforms() {
        return ['win32'];
    }

    install(basicInfo: util.BasicInfo, packageName: string, outputListener: (data: string) => void) {
        return new Promise<void>((resolve) => {
            cp.spawn('powershell', ['-Command', `Start-Process choco -Verb Runas -ArgumentList 'install --yes ${packageName}' -Wait -WindowStyle Hidden`])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()));
        });
    }
}

export default ChocolateyBackend;