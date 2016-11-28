import Backend from '../backend';
declare class PackageKitBackend extends Backend {
    readonly prettyName: string;
    readonly name: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageNames: string[]): Promise<any>;
}
export default PackageKitBackend;
