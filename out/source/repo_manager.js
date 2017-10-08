'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
class RepoManager {
    constructor() {
        this._repos = [];
    }
    addRepo(repo) {
        this._repos.push(repo);
    }
    getPackage(packageName) {
        return Promise.race(this._repos.map((repo) => new Promise((resolve) => {
            request.get(`${repo}/${packageName}.json`, (err, message, body) => {
                if (!err && message.statusCode / 100 === 2) {
                    resolve(JSON.parse(body));
                }
            });
        })));
    }
}
exports.default = RepoManager;
//# sourceMappingURL=repo_manager.js.map