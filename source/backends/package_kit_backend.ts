'use strict';

import * as cp from 'child_process';
import * as rl from 'readline';
import Backend from '../backend';

export type PackageInfo = string | string[];

class PackageKitBackend extends Backend<PackageInfo> {
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

    packageAvailable(packageInfo: PackageInfo) {
        return this.resolvePackageName(packageInfo)
            .then((name) => !!name);
    }

    install(name: string, packageInfo: PackageInfo, outputListener: (data: string) => void) {
        return this.resolvePackageName(packageInfo)
            .then((name) => new Promise((resolve) => name
                ? cp.spawn(this.command, ['--noninteractive', 'install', name])
                    .on('exit', resolve)
                    .stdout.on('data', (data) => outputListener(data.toString()))
                : resolve()
            )).then(() => undefined);
    }

    private resolvePackageName(packageInfo: PackageInfo) {
        let packageNames = typeof packageInfo !== 'string' ? packageInfo : [packageInfo];
        return Promise.all(packageNames.map((packageName) => new Promise((resolve) => {
            let pkresolve = cp.spawn(this.command, ['--plain', 'resolve', packageName], { env: { LANG: 'C' } });
            let reader = rl.createInterface(pkresolve.stdout, null);
            let readingData = false;

            reader.on('line', (line: string) => {
                if (line.indexOf('Results') !== -1) {
                    readingData = true;
                } else if (readingData) {
                    resolve(packageName);
                }
            });

            reader.on('close', resolve.bind(null, ''));
        }))).then((names: string[]) => names.find((name) => name.length > 0));
    }
}

export default PackageKitBackend;