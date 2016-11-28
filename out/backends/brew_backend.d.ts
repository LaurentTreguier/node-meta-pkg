import Backend from '../backend';
declare class BrewBackend extends Backend {
    readonly prettyName: string;
    readonly name: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageName: string): Promise<void>;
}
export default BrewBackend;
