import Backend from '../backend';
import * as util from '../util';
declare class FallbackBackend extends Backend<any> {
    static readonly packagesPath: string;
    static isUpgradable(basicInfo: util.BasicInfo, packageInfo: any): Promise<boolean>;
    private static init;
    private static completePath;
    constructor();
    readonly name = "fallback";
    readonly prettyName = "Local install";
    readonly command = "";
    readonly platforms: string[];
    packageAvailable(packageInfo: any): Promise<boolean>;
    install(basicInfo: util.BasicInfo, packageInfo: any, outputListener: (data: string) => void): Promise<void>;
}
export default FallbackBackend;
