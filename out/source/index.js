'use strict';
const repo_manager_1 = require("./repo_manager");
const package_kit_backend_1 = require("./backends/package_kit_backend");
const brew_backend_1 = require("./backends/brew_backend");
const util = require("./util");
const repoManager = new repo_manager_1.default();
const backends = [
    new package_kit_backend_1.default(),
    new brew_backend_1.default()
].filter((backend) => backend.available);
function isInstalled(packageInfo) {
    return getPackage(packageInfo).then((pkg) => {
        return pkg.targets.every(util.checkExistence);
    });
}
exports.isInstalled = isInstalled;
;
function getInstallers(packageInfo) {
    return getPackage(packageInfo).then((pkg) => backends.filter((backend) => pkg.backends[backend.name])
        .map((backend) => new Installer(backend, pkg)));
}
exports.getInstallers = getInstallers;
;
function addRepo(repo) {
    repoManager.addRepo(repo);
}
exports.addRepo = addRepo;
;
function getPackage(packageInfo) {
    return typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
}
class Installer {
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
exports.Installer = Installer;
;
//# sourceMappingURL=index.js.map