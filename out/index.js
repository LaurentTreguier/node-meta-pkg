'use strict';
import RepoManager from './repo_manager';
import PackagekitBackend from './backends/packagekit_backend';
import BrewBackend from './backends/brew_backend';
import * as util from './util';
const repoManager = new RepoManager();
const backends = [
    new PackagekitBackend(),
    new BrewBackend()
].filter((backend) => backend.available);
export function getInstallers(packageInfo) {
    let promise = typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
    return promise.then((pkg) => backends.filter((backend) => pkg.backends[backend.name])
        .map((backend) => new Installer(backend, pkg)));
}
;
export function addRepo(repo) {
    repoManager.addRepo(repo);
}
export class Installer {
    constructor(backend, pkg) {
        this._backend = backend;
        this._package = pkg;
    }
    get name() {
        return this._backend.name;
    }
    install() {
        let packageInstalled = this._package.targets.every(util.checkExistence);
        return packageInstalled
            ? Promise.resolve()
            : this._backend.install(this._package.backends[this._backend.name]);
    }
}
;
