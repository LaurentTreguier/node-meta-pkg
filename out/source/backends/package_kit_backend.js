'use strict';
const cp = require("child_process");
const rl = require("readline");
const backend_1 = require("../backend");
class PackageKitBackend extends backend_1.default {
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
    install(packageNames, outputListener) {
        return Promise.all(packageNames.map((packageName) => new Promise((resolve) => {
            let pkresolve = cp.spawn(this.command, ['--plain', 'resolve', packageName], { env: { LANG: 'C' } });
            let reader = rl.createInterface(pkresolve.stdout, null);
            reader.on('line', (line) => {
                if (line.indexOf('Available') !== -1) {
                    resolve(packageName);
                }
            });
            reader.on('close', resolve.bind(null, ''));
        }))).then((names) => new Promise((resolve) => {
            let name = names.find((name) => name.length > 0);
            if (name) {
                cp.spawn(this.command, ['--plain', '--noninteractive', 'install', name])
                    .on('exit', resolve)
                    .stdout.on('data', (data) => outputListener(data.toString()));
            }
            else {
                resolve();
            }
        })).then(() => undefined);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PackageKitBackend;
//# sourceMappingURL=package_kit_backend.js.map