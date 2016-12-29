import Backend from '../backend';
declare class PackageKitBackend extends Backend<string | string[]> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageInfo: string | string[], outputListener: (data: string) => void): Promise<any>;
}
export default PackageKitBackend;
