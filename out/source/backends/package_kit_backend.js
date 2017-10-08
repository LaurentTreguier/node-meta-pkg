'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
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
    packageAvailable(packageInfo) {
        return this.resolvePackageName(packageInfo)
            .then((name) => !!name);
    }
    install(basicInfo, packageInfo, outputListener) {
        return this.resolvePackageName(packageInfo)
            .then((name) => new Promise((resolve) => name
            ? cp.spawn(this.command, ['--noninteractive', 'install', name])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()))
            : resolve())).then(() => undefined);
    }
    resolvePackageName(packageInfo) {
        let packageNames = typeof packageInfo !== 'string' ? packageInfo : [packageInfo];
        return Promise.all(packageNames.map((packageName) => new Promise((resolve) => {
            let pkresolve = cp.spawn(this.command, ['--plain', 'resolve', packageName], { env: { LANG: 'C' } });
            let reader = rl.createInterface(pkresolve.stdout, null);
            let readingData = false;
            reader.on('line', (line) => {
                if (line.indexOf('Results') !== -1) {
                    readingData = true;
                }
                else if (readingData) {
                    resolve(packageName);
                }
            });
            reader.on('close', resolve.bind(null, ''));
        }))).then((names) => names.find((name) => name.length > 0));
    }
}
exports.default = PackageKitBackend;
//# sourceMappingURL=package_kit_backend.js.map