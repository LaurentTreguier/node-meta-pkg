'use strict';

import * as cp from 'child_process';
import * as rl from 'readline';
import Backend from '../backend';

class PackageKitBackend extends Backend {
    get prettyName() {
        return 'PackageKit';
    }

    get name() {
        return 'packagekit';
    }

    get command() {
        return 'pkcon';
    }

    get platforms() {
        return ['freebsd', 'linux'];
    }

    install(packageNames: string[], outputListener: (chunk) => void) {
        return Promise.all(packageNames.map((packageName) => new Promise((resolve) => {
            let pkresolve = cp.spawn(this.command, ['--plain', 'resolve', packageName], { env: { LANG: 'C' } });
            let reader = rl.createInterface(pkresolve.stdout, null);

            reader.on('line', (line: string) => {
                if (line.indexOf('Available') !== -1) {
                    resolve(packageName);
                }
            });

            reader.on('close', resolve.bind(null, ''));
        }))).then((names: string[]) => new Promise((resolve) =>
            cp.spawn(this.command, ['--plain', '--noninteractive', 'install', names.find((name) => name.length > 0)])
                .on('exit', resolve)
                .stdout.on('data', outputListener)
        )).then(() => undefined);
    }
}

export default PackageKitBackend;