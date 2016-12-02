'use strict';
import * as cp from 'child_process';
import Backend from '../backend';
class BrewBackend extends Backend {
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
export default BrewBackend;
