'use strict';
const cp = require("child_process");
const backend_1 = require("../backend");
class BrewBackend extends backend_1.default {
    get prettyName() {
        return 'Brew';
    }
    get name() {
        return 'brew';
    }
    get command() {
        return 'brew';
    }
    get platforms() {
        return ['darwin', 'linux'];
    }
    install(packageName) {
        return new Promise((resolve) => {
            cp.spawn(this.command, ['install', packageName])
                .on('exit', resolve);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BrewBackend;
//# sourceMappingURL=brew_backend.js.map