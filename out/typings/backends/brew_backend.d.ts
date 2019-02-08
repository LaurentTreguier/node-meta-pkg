import Backend from '../backend';
import * as util from '../util';
declare class BrewBackend extends Backend<string> {
    readonly name = "brew";
    readonly prettyName = "Brew";
    readonly command = "brew";
    readonly platforms: string[];
    install(basicInfo: util.BasicInfo, packageName: string, outputListener: (data: string) => void): Promise<void>;
}
export default BrewBackend;
