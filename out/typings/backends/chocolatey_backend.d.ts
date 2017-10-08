import Backend from '../backend';
import * as util from '../util';
declare class ChocolateyBackend extends Backend<string> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    install(basicInfo: util.BasicInfo, packageName: string, outputListener: (data: string) => void): Promise<void>;
}
export default ChocolateyBackend;
