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
const backend_1 = require("../backend");
class ChocolateyBackend extends backend_1.default {
    get name() {
        return 'chocolatey';
    }
    get prettyName() {
        return 'Chocolatey';
    }
    get command() {
        return 'choco';
    }
    get platforms() {
        return ['win32'];
    }
    install(basicInfo, packageName, outputListener) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                cp.spawn('powershell', ['-Command', `Start-Process choco -Verb Runas -ArgumentList 'install --yes ${packageName}' -Wait -WindowStyle Hidden`])
                    .on('exit', resolve)
                    .stdout.on('data', (data) => outputListener(data.toString()));
            });
        });
    }
}
exports.default = ChocolateyBackend;
//# sourceMappingURL=chocolatey_backend.js.map