'use strict';
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
        return new Promise((resolve) => {
            cp.spawn('powershell', ['-Command', `Start-Process choco -Verb Runas -ArgumentList 'install --yes ${packageName}' -Wait -WindowStyle Hidden`])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()));
        });
    }
}
exports.default = ChocolateyBackend;
//# sourceMappingURL=chocolatey_backend.js.map