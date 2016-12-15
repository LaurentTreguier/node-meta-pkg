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

export type PackageInfo = string | Package;

export function isInstalled(packageInfo: PackageInfo) {
    return getPackage(packageInfo).then((pkg) => {
        return pkg.targets.every(util.checkExistence);
    });
};

export function getInstallers(packageInfo: PackageInfo) {
    return getPackage(packageInfo).then((pkg) => backends.filter((backend) => pkg.backends[backend.name])
        .map((backend) => new Installer(backend, pkg)));
};

export function addRepo(repo: string) {
    repoManager.addRepo(repo);
};

function getPackage(packageInfo: PackageInfo) {
    return typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
}

export class Installer {
    private _backend: Backend;
    private _package: Package;

    get name() {
        return this._backend.prettyName;
    }

    constructor(backend: Backend, pkg: any) {
        this._backend = backend;
        this._package = pkg;
    }

    install(outputListener?: (chunk) => void) {
        let packageInstalled = this._package.targets.every(util.checkExistence);

        return packageInstalled
            ? Promise.resolve(false)
            : this._backend.install(this._package.backends[this._backend.name], outputListener || (() => { }))
                .then(() => true);
    }
};