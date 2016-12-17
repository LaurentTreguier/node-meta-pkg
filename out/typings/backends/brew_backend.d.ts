import Backend from '../backend';
declare class BrewBackend extends Backend {
    readonly prettyName: string;
    readonly name: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageName: string, outputListener: (chunk) => void): Promise<void>;
}
export default BrewBackend;
