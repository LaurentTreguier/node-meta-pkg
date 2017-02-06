import Backend from '../backend';
declare class BrewBackend extends Backend<string> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    install(name: string, packageName: string, outputListener: (data: string) => void): Promise<void>;
}
export default BrewBackend;
