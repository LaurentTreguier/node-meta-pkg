'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from './util';

abstract class Backend<T> {
    abstract get name(): string;
    abstract get prettyName(): string;
    abstract get command(): string;
    abstract get platforms(): string[];
    abstract install(packageInfo: T, outputListener: (data: string) => void): PromiseLike<void>;

    get available() {
        return util.checkExistence(this.command) && this.platforms.indexOf(process.platform) !== -1;
    }

    packageAvailable(packageInfo: T) {
        return true;
    }
}

export default Backend;