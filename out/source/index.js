'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    return __awaiter(this, void 0, void 0, function* () {
        const pkg = yield getPackage(packageInfo);
        return pkg.targets.length && pkg.targets.every(util.checkExistence);
    });
}
exports.isInstalled = isInstalled;
function isUpgradable(packageInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const pkg = yield getPackage(packageInfo);
        return pkg.backends.fallback
            ? yield fallback_backend_1.default.isUpgradable({ name: pkg.name, version: pkg.version }, pkg.backends.fallback)
            : false;
    });
}
exports.isUpgradable = isUpgradable;
function getInstallers(packageInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const pkg = yield getPackage(packageInfo);
        const availableBackends = backends.filter((backend) => pkg.backends[backend.name]);
        const results = yield Promise.all(availableBackends.map((backend) => backend.packageAvailable(pkg.backends[backend.name])));
        const actuallyAvailableBackends = availableBackends.filter((backend, i) => results[i]);
        return actuallyAvailableBackends.map((backend) => new Installer(backend, pkg));
    });
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
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof (packageInfo) !== 'string') {
            registerPackage(packageInfo);
            return packageInfo;
        }
        return registeredPackages.has(packageInfo)
            ? registeredPackages.get(packageInfo)
            : yield repoManager.getPackage(packageInfo);
    });
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
        return __awaiter(this, void 0, void 0, function* () {
            const installed = yield isInstalled(this._package);
            const basicInfo = { name: this._package.name, version: this._package.version };
            yield this._backend.install(basicInfo, this._package.backends[this._backend.name], outputListener || (() => { }));
            return installed;
        });
    }
}
exports.Installer = Installer;
//# sourceMappingURL=index.js.map