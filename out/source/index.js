'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const repo_manager_1 = require("./repo_manager");
const package_kit_backend_1 = require("./backends/package_kit_backend");
const brew_backend_1 = require("./backends/brew_backend");
const chocolatey_backend_1 = require("./backends/chocolatey_backend");
const fallback_backend_1 = require("./backends/fallback_backend");
const util = require("./util");
const repoManager = new repo_manager_1.default();
const backends = [
    new package_kit_backend_1.default(),
    new brew_backend_1.default(),
    new chocolatey_backend_1.default(),
    new fallback_backend_1.default()
].filter((backend) => backend.available);
let registeredPackages = new Map();
function registerPackage(pkg) {
    registeredPackages.set(pkg.name, pkg);
}
exports.registerPackage = registerPackage;
function isInstalled(packageInfo) {
    return getPackage(packageInfo)
        .then((pkg) => pkg.targets.length && pkg.targets.every(util.checkExistence));
}
exports.isInstalled = isInstalled;
function isUpgradable(packageInfo) {
    return getPackage(packageInfo).then((pkg) => pkg.backends.fallback
        ? fallback_backend_1.default.isUpgradable({ name: pkg.name, version: pkg.version }, pkg.backends.fallback)
        : false);
}
exports.isUpgradable = isUpgradable;
function getInstallers(packageInfo) {
    let availableBackends;
    let resolvedPackage;
    return getPackage(packageInfo)
        .then((pkg) => {
        availableBackends = backends.filter((backend) => pkg.backends[backend.name]);
        resolvedPackage = pkg;
    }).then(() => Promise.all(availableBackends.map((backend) => backend.packageAvailable(resolvedPackage.backends[backend.name]))))
        .then((results) => availableBackends.filter((backend, i) => results[i]))
        .then((actuallyAvailableBackends) => actuallyAvailableBackends.map((backend) => new Installer(backend, resolvedPackage)));
}
exports.getInstallers = getInstallers;
function addRepo(repo) {
    repoManager.addRepo(repo);
}
exports.addRepo = addRepo;
function getFallbackPackagesPath() {
    return fallback_backend_1.default.packagesPath;
}
exports.getFallbackPackagesPath = getFallbackPackagesPath;
function getPackage(packageInfo) {
    if (typeof (packageInfo) !== 'string') {
        registerPackage(packageInfo);
        return Promise.resolve(packageInfo);
    }
    return registeredPackages.has(packageInfo)
        ? Promise.resolve(registeredPackages.get(packageInfo))
        : repoManager.getPackage(packageInfo);
}
class Installer {
    get name() {
        return this._backend.name;
    }
    get prettyName() {
        return this._backend.prettyName;
    }
    constructor(backend, pkg) {
        this._backend = backend;
        this._package = pkg;
    }
    install(outputListener) {
        let alreadyInstalled;
        return isInstalled(this._package)
            .then((installed) => {
            let basicInfo = {
                name: this._package.name,
                version: this._package.version
            };
            alreadyInstalled = installed;
            return this._backend.install(basicInfo, this._package.backends[this._backend.name], outputListener || (() => { }));
        }).then(() => alreadyInstalled);
    }
}
exports.Installer = Installer;
//# sourceMappingURL=index.js.map