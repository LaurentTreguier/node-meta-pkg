'use strict';

import Package from './package';
import RepoManager from './repo_manager';
import Backend from './backend';
import PackageKitBackend from './backends/package_kit_backend';
import BrewBackend from './backends/brew_backend';
import * as util from './util';

const repoManager = new RepoManager();
const backends: Backend[] = [
    new PackageKitBackend(),
    new BrewBackend()
].filter((backend) => backend.available);

export function getInstallers(packageInfo: string | Package): PromiseLike<Installer[]> {
    let promise = typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
    return promise.then((pkg) => backends.filter((backend) => pkg.backends[backend.name])
        .map((backend) => new Installer(backend, pkg)));
};

export function addRepo(repo: string) {
    repoManager.addRepo(repo);
}

export class Installer {
    private _backend: Backend;
    private _package: Package;

    get name() {
        return this._backend.name;
    }

    constructor(backend: Backend, pkg: any) {
        this._backend = backend;
        this._package = pkg;
    }

    install() {
        let packageInstalled = this._package.targets.every(util.checkExistence);

        return packageInstalled
            ? Promise.resolve()
            : this._backend.install(this._package.backends[this._backend.name]);
    }
};