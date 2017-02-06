import Backend from '../backend';
declare class FallbackBackend extends Backend<any> {
    static init(): PromiseLike<any>;
    static readonly packagesPath: string;
    static isUpgradable(name: string, packageInfo: any): PromiseLike<boolean>;
    private static completePath();
    private static getInfo(packageInfo);
    private static retrieveLatestVersion(version, outputListener?);
    constructor();
    readonly name: string;
    readonly prettyName: string;
    readonly command: any;
    readonly platforms: string[];
    packageAvailable(packageInfo: any): Promise<boolean>;
    install(name: string, packageInfo: any, outputListener: (data: string) => void): PromiseLike<any>;
}
export default FallbackBackend;
