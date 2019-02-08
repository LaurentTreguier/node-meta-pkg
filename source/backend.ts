'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from './util';

abstract class Backend<T> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    abstract install(basicInfo: util.BasicInfo, packageInfo: T, outputListener: (data: string) => void): PromiseLike<void>;

    get available() {
        return util.checkExistence(this.command) && this.platforms.indexOf(process.platform) !== -1;
    }

    packageAvailable(packageInfo: T) {
        return Promise.resolve(true);
    }
}

export default Backend;