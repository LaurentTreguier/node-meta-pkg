'use strict';
const cp = require("child_process");
const backend_1 = require("../backend");
class BrewBackend extends backend_1.default {
    get name() {
        return 'brew';
    }
    get prettyName() {
        return 'Brew';
    }
    get command() {
        return 'brew';
    }
    get platforms() {
        return ['darwin', 'linux'];
    }
    install(packageName, outputListener) {
        return new Promise((resolve) => {
            cp.spawn(this.command, ['install', packageName])
                .on('exit', resolve)
                .stdout.on('data', (data) => outputListener(data.toString()));
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BrewBackend;
//# sourceMappingURL=brew_backend.js.map