import Backend from '../backend';
import * as util from '../util';
declare class ChocolateyBackend extends Backend<string> {
    readonly name = "chocolatey";
    readonly prettyName = "Chocolatey";
    readonly command = "choco";
    readonly platforms: string[];
    install(basicInfo: util.BasicInfo, packageName: string, outputListener: (data: string) => void): Promise<void>;
}
export default ChocolateyBackend;
