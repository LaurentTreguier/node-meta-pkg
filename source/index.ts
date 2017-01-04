'use strict';

import Package from './package';
import RepoManager from './repo_manager';
import Backend from './backend';
import PackageKitBackend from './backends/package_kit_backend';
import BrewBackend from './backends/brew_backend';
import ChocolateyBackend from './backends/chocolatey_backend';
import FallbackBackend from './backends/fallback_backend';
import * as util from './util';

const repoManager = new RepoManager();
const backends: Backend<any>[] = [
    new PackageKitBackend(),
    new BrewBackend(),
    new ChocolateyBackend(),
    new FallbackBackend()
].filter((backend) => backend.available);

export { Package }
export type PackageInfo = string | Package;

export function isInstalled(packageInfo: PackageInfo) {
    return getPackage(packageInfo).then((pkg) => {
        return pkg.targets.length
            && pkg.targets.every(util.checkExistence);
    });
}

export function isUpgradable(packageInfo: PackageInfo) {
    return getPackage(packageInfo).then((pkg) =>
        pkg.backends.fallback
            ? FallbackBackend.isUpgradable(pkg.backends.fallback)
            : false);
}

export function getInstallers(packageInfo: PackageInfo) {
    let availableBackends: Backend<any>[];
    let resolvedPackage: Package;
    return getPackage(packageInfo)
        .then((pkg) => {
            availableBackends = backends.filter((backend) => pkg.backends[backend.name]);
            resolvedPackage = pkg;
        }).then(() => Promise.all(availableBackends.map((backend) =>
            backend.packageAvailable(resolvedPackage.backends[backend.name]))))
        .then((results) => availableBackends.filter((backend, i) => results[i]))
        .then((actuallyAvailableBackends) => actuallyAvailableBackends.map((backend) => new Installer(backend, resolvedPackage)));
}

export function addRepo(repo: string) {
    repoManager.addRepo(repo);
}

export function getFallbackPackagesPath() {
    return FallbackBackend.packagesPath;
}

function getPackage(packageInfo: PackageInfo) {
    return typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
}

export class Installer {
    private _backend: Backend<any>;
    private _package: Package;

    get name() {
        return this._backend.prettyName;
    }

    constructor(backend: Backend<any>, pkg: any) {
        this._backend = backend;
        this._package = pkg;
    }

    install(outputListener?: (data: string) => void) {
        let alreadyInstalled: boolean;
        return isInstalled(this._package)
            .then((installed) => {
                alreadyInstalled = installed;
                return this._backend.install(this._package.backends[this._backend.name],
                    outputListener || (() => { }));
            }).then(() => alreadyInstalled);
    }
}