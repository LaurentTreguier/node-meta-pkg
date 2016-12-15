'use strict';

import * as cp from 'child_process';
import Backend from '../backend';

class BrewBackend extends Backend {
    get prettyName() {
        return 'Brew';
    }

    get name() {
        return 'brew';
    }

    get command() {
        return 'brew';
    }

    get platforms() {
        return ['darwin', 'linux'];
    }

    install(packageName: string, outputListener: (chunk) => void) {
        return new Promise<void>((resolve) => {
            cp.spawn(this.command, ['install', packageName])
                .on('exit', resolve)
                .stdout.on('data', outputListener);
        });
    }
}

export default BrewBackend;