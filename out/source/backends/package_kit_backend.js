'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const rl = require("readline");
const backend_1 = require("../backend");
class PackageKitBackend extends backend_1.default {
    constructor() {
        super(...arguments);
        this.name = 'packagekit';
        this.prettyName = 'PackageKit';
        this.command = 'pkcon';
        this.platforms = ['freebsd', 'linux'];
    }
    packageAvailable(packageInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return !!(yield this.resolvePackageName(packageInfo));
        });
    }
    install(basicInfo, packageInfo, outputListener) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = yield this.resolvePackageName(packageInfo);
            yield new Promise((resolve) => name ? cp.spawn(this.command, ['--noninteractive', 'install', name])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()))
                : resolve());
            return undefined;
        });
    }
    resolvePackageName(packageInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let packageNames = typeof packageInfo !== 'string' ? packageInfo : [packageInfo];
            for (let packageName of packageNames) {
                const name = yield new Promise((resolve) => {
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
                });
                if (name.length > 0) {
                    return name;
                }
            }
        });
    }
}
exports.default = PackageKitBackend;
//# sourceMappingURL=package_kit_backend.js.map