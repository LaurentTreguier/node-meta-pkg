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
function getInstallers(packageInfo) {
    let promise = typeof (packageInfo) === 'string'
        ? repoManager.getPackage(packageInfo)
        : Promise.resolve(packageInfo);
    return promise.then((pkg) => backends.filter((backend) => pkg.backends[backend.name])
        .map((backend) => new Installer(backend, pkg)));
}
exports.getInstallers = getInstallers;
;
function addRepo(repo) {
    repoManager.addRepo(repo);
}
exports.addRepo = addRepo;
class Installer {
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
exports.Installer = Installer;
;
//# sourceMappingURL=index.js.map