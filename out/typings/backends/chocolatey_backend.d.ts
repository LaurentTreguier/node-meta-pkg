import Backend from '../backend';
declare class ChocolateyBackend extends Backend<string> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    install(packageName: string, outputListener: (data: string) => void): Promise<void>;
}
export default ChocolateyBackend;
