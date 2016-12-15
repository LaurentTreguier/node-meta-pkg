'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from './util';

abstract class Backend {
    abstract get prettyName(): string;
    abstract get name(): string;
    abstract get command(): string;
    abstract get platforms(): string[];
    abstract install(packageInfo: any, outputListener: (chunk) => void): PromiseLike<void>;

    get available() {
        return util.checkExistence(this.command) && this.platforms.indexOf(process.platform) !== -1;
    }
}

export default Backend;