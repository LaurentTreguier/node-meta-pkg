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
        return ['linux'];
    }
    install(packageNames) {
        return Promise.all(packageNames.map((packageName) => new Promise((resolve) => {
            let pkresolve = cp.spawn(this.command, ['--plain', 'resolve', packageName], { env: { LANG: 'C' } });
            let reader = rl.createInterface(pkresolve.stdout, null);
            reader.on('line', (line) => {
                if (line.indexOf('Available') !== -1) {
                    resolve(packageName);
                }
            });
            reader.on('close', resolve.bind(null, ''));
        }))).then((names) => new Promise((resolve) => cp.spawn(this.command, ['--plain', '--noninteractive', 'install', names.find((name) => name.length > 0)])
            .on('exit', resolve))).then(() => undefined);
    }
}
export default PackageKitBackend;
