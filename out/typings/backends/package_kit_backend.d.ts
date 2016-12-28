import Backend from '../backend';
declare class PackageKitBackend extends Backend<string[]> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageNames: string[], outputListener: (data: string) => void): Promise<any>;
}
export default PackageKitBackend;
