'use strict';
const cp = require("child_process");
const backend_1 = require("../backend");
class PackageKitBackend extends backend_1.default {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PackageKitBackend;
//# sourceMappingURL=packagekit_backend.js.map