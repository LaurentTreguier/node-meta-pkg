'use strict';
import RepoManager from './repo_manager';
import PackageKitBackend from './backends/package_kit_backend';
import BrewBackend from './backends/brew_backend';
import * as util from './util';
const repoManager = new RepoManager();
const backends = [
    new PackageKitBackend(),
    new BrewBackend()
].filter((backend) => backend.available);
export function isInstalled(packageInfo) {
    return getPackage(packageInfo).then((pkg) => {
        return pkg.targets.every(util.checkExistence);
    });
}
;
export function getInstallers(packageInfo) {
    return getPackage(packageInfo).then((pkg) => backends.filter((backend) => pkg.backends[backend.name])
        .map((backend) => new Installer(backend, pkg)));
}
;
export function addRepo(repo) {
    repoManager.addRepo(repo);
}
;
function getPackage(packageInfo) {
    return typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
}
export class Installer {
    constructor(backend, pkg) {
        this._backend = backend;
        this._package = pkg;
    }
    get name() {
        return this._backend.prettyName;
    }
    install() {
        let packageInstalled = this._package.targets.every(util.checkExistence);
        return packageInstalled
            ? Promise.resolve(true)
            : this._backend.install(this._package.backends[this._backend.name])
                .then(() => false);
    }
}
;
