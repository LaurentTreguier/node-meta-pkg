'use strict';

import * as http from 'http';
import * as request from 'request';
import Package from './package';

class RepoManager {
    private _repos: string[] = [];

    addRepo(repo: string) {
        this._repos.push(repo);
    }

    getPackage(packageName: string): PromiseLike<Package> {
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