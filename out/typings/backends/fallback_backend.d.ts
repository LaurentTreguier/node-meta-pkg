import Backend from '../backend';
declare class FallbackBackend extends Backend<any> {
    static init(): Promise<{}>;
    static readonly packagesPath: string;
    static isUpgradable(packageInfo: any): Promise<any>;
    constructor();
    readonly name: string;
    readonly prettyName: string;
    readonly command: any;
    readonly platforms: string[];
    packageAvailable(packageInfo: any): Promise<boolean>;
    install(packageInfo: any, outputListener: (data: string) => void): Promise<any>;
    private static retrieveLatestVersion(version, outputListener?);
}
export default FallbackBackend;
