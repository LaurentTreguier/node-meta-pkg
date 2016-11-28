'use strict';
import * as cp from 'child_process';
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
        let promise = Promise.resolve(1);
        packageNames.forEach((packageName) => {
            promise = promise.then((code) => {
                return code
                    ? new Promise((resolve) => {
                        cp.spawn(this.command, ['--plain', '--noninteractive', 'install', packageName])
                            .on('exit', resolve);
                    })
                    : 0;
            });
        });
        return promise.then(() => undefined);
    }
}
export default PackageKitBackend;
