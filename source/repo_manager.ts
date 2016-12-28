'use strict';

import * as request from 'request';
import Package from './package';

class RepoManager {
    private _repos: string[] = [];

    addRepo(repo: string) {
        this._repos.push(repo);
    }

    getPackage(packageName: string): PromiseLike<Package> {
        return Promise.race(this._repos.map((repo) => new Promise((resolve) => {
            request.get(`${repo}/${packageName}.json`, (err, message, body) => {
                if (!err && message.statusCode / 100 === 2) {
                    resolve(JSON.parse(body));
                }
            });
        })));
    }
}

export default RepoManager;