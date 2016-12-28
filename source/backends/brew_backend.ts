'use strict';

import * as cp from 'child_process';
import Backend from '../backend';

class BrewBackend extends Backend<string> {
    get name() {
        return 'brew';
    }

    get prettyName() {
        return 'Brew';
    }

    get command() {
        return 'brew';
    }

    get platforms() {
        return ['darwin', 'linux'];
    }

    install(packageName: string, outputListener: (data: string) => void) {
        return new Promise<void>((resolve) => {
            cp.spawn(this.command, ['install', packageName])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()));
        });
    }
}

export default BrewBackend;