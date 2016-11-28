'use strict';
import * as request from 'request';
class RepoManager {
    constructor() {
        this._repos = [];
    }
    addRepo(repo) {
        this._repos.push(repo);
    }
    getPackage(packageName) {
        return Promise.race(this._repos.map((repo) => new Promise((resolve) => {
            request(`${repo}/${packageName}.json`, (err, res, body) => {
                if (!err && res.statusCode / 100 === 2) {
                    resolve(body);
                }
            });
        })));
    }
}
export default RepoManager;
