'use strict';

import * as cp from 'child_process';
import * as rl from 'readline';
import Backend from '../backend';

class PackageKitBackend extends Backend<string | string[]> {
    get name() {
        return 'packagekit';
    }

    get prettyName() {
        return 'PackageKit';
    }

    get command() {
        return 'pkcon';
    }

    get platforms() {
        return ['freebsd', 'linux'];
    }

    install(packageInfo: string | string[], outputListener: (data: string) => void) {
        let packageNames = packageInfo instanceof Array ? packageInfo : [packageInfo];
        return Promise.all(packageNames.map((packageName) => new Promise((resolve) => {
            let pkresolve = cp.spawn(this.command, ['--plain', 'resolve', packageName], { env: { LANG: 'C' } });
            let reader = rl.createInterface(pkresolve.stdout, null);

            reader.on('line', (line: string) => {
                if (line.indexOf('Available') !== -1) {
                    resolve(packageName);
                }
            });

            reader.on('close', resolve.bind(null, ''));
        }))).then((names: string[]) => new Promise((resolve) => {
            let name = names.find((name) => name.length > 0);

            if (name) {
                cp.spawn(this.command, ['--plain', '--noninteractive', 'install', name])
                    .on('exit', resolve)
                    .stdout.on('data', (data) => outputListener(data.toString()));
            } else {
                resolve();
            }
        })).then(() => undefined);
    }
}

export default PackageKitBackend;