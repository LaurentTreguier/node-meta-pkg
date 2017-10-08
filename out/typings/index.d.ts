import Package from './package';
import Backend from './backend';
export { Package };
export declare type PackageInfo = string | Package;
export declare function registerPackage(pkg: Package): void;
export declare function isInstalled(packageInfo: PackageInfo): Promise<boolean>;
export declare function isUpgradable(packageInfo: PackageInfo): Promise<boolean>;
export declare function getInstallers(packageInfo: PackageInfo): Promise<Installer[]>;
export declare function addRepo(repo: string): void;
export declare function getFallbackPackagesPath(): string;
export declare class Installer {
    private _backend;
    private _package;
    readonly name: string;
    readonly prettyName: string;
    constructor(backend: Backend<any>, pkg: any);
    install(outputListener?: (data: string) => void): Promise<boolean>;
}
