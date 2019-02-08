'use strict';

import * as cp from 'child_process';
import * as rl from 'readline';
import Backend from '../backend';
import * as util from '../util';

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

    async packageAvailable(packageInfo: PackageInfo) {
        return !!(await this.resolvePackageName(packageInfo));
    }

    async install(basicInfo: util.BasicInfo, packageInfo: PackageInfo, outputListener: (data: string) => void) {
        const name = await this.resolvePackageName(packageInfo);
        await new Promise((resolve) => name ? cp.spawn(this.command, ['--noninteractive', 'install', name])
            .on('exit', resolve)
            .stdout.on('data', (data) => outputListener(data.toString()))
            : resolve());
        return undefined;
    }

    private async resolvePackageName(packageInfo: PackageInfo) {
        let packageNames = typeof packageInfo !== 'string' ? packageInfo : [packageInfo];

        for (let packageName of packageNames) {
            const name = await new Promise<string>((resolve) => {
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
            });

            if (name.length > 0) {
                return name;
            }
        }
    }
}

export default PackageKitBackend;