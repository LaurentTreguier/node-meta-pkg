'use strict';
import * as util from './util';
class Backend {
    get available() {
        return util.checkExistence(this.command) && this.platforms.indexOf(process.platform) !== -1;
    }
}
export default Backend;
