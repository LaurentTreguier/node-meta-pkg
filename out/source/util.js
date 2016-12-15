'use strict';
const fs = require("fs");
const path = require("path");
function checkExistence(command) {
    let isWin = process.platform === 'win32';
    let exists = false;
    process.env.PATH.split(isWin ? ';' : ':').forEach((dir) => {
        for (let extension of ['', '.exe', '.bat']) {
            try {
                fs.accessSync(path.join(dir, command + extension), fs.constants.F_OK);
                exists = true;
                break;
            }
            catch (e) { }
        }
    });
    return exists || !command;
}
exports.checkExistence = checkExistence;
//# sourceMappingURL=util.js.map