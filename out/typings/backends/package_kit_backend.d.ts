import Backend from '../backend';
declare class PackageKitBackend extends Backend {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageNames: string[], outputListener: (chunk) => void): Promise<any>;
}
export default PackageKitBackend;
