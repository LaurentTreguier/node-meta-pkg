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
let registeredPackages = new Map<string, Package>();

export { Package }
export type PackageInfo = string | Package;

export function registerPackage(pkg: Package): void {
    registeredPackages.set(pkg.name, pkg);
}

export async function isInstalled(packageInfo: PackageInfo): Promise<boolean> {
    const pkg = await getPackage(packageInfo);
    return pkg.targets.length && pkg.targets.every(util.checkExistence);
}

export async function isUpgradable(packageInfo: PackageInfo): Promise<boolean> {
    const pkg = await getPackage(packageInfo);
    return pkg.backends.fallback
        ? await FallbackBackend.isUpgradable({ name: pkg.name, version: pkg.version }, pkg.backends.fallback)
        : false;
}

export async function getInstallers(packageInfo: PackageInfo): Promise<Installer[]> {
    const pkg = await getPackage(packageInfo);
    const availableBackends = backends.filter((backend) => pkg.backends[backend.name]);
    const results = await Promise.all(availableBackends.map((backend) => backend.packageAvailable(pkg.backends[backend.name])));
    const actuallyAvailableBackends = availableBackends.filter((backend, i) => results[i]);
    return actuallyAvailableBackends.map((backend) => new Installer(backend, pkg));
}

export function addRepo(repo: string): void {
    repoManager.addRepo(repo);
}

export function getFallbackPackagesPath(): string {
    return FallbackBackend.packagesPath;
}

async function getPackage(packageInfo: PackageInfo) {
    if (typeof (packageInfo) !== 'string') {
        registerPackage(packageInfo);
        return packageInfo;
    }

    return registeredPackages.has(packageInfo)
        ? registeredPackages.get(packageInfo)
        : await repoManager.getPackage(packageInfo);
}

export class Installer {
    private _backend: Backend<any>;
    private _package: Package;

    get name() {
        return this._backend.name;
    }

    get prettyName() {
        return this._backend.prettyName;
    }

    constructor(backend: Backend<any>, pkg: any) {
        this._backend = backend;
        this._package = pkg;
    }

    async install(outputListener?: (data: string) => void) {
        const installed = await isInstalled(this._package);
        const basicInfo = { name: this._package.name, version: this._package.version };
        await this._backend.install(basicInfo, this._package.backends[this._backend.name], outputListener || (() => { }));
        return installed;
    }
}