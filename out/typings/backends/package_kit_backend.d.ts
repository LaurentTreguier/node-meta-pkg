import Backend from '../backend';
export declare type PackageInfo = string | string[];
declare class PackageKitBackend extends Backend<PackageInfo> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    packageAvailable(packageInfo: PackageInfo): Promise<boolean>;
    install(name: string, packageInfo: PackageInfo, outputListener: (data: string) => void): Promise<any>;
    private resolvePackageName(packageInfo);
}
export default PackageKitBackend;
