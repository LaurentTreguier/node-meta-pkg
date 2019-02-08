import * as util from './util';
declare abstract class Backend<T> {
    readonly name: string;
    readonly prettyName: string;
    readonly command: string;
    readonly platforms: string[];
    abstract install(basicInfo: util.BasicInfo, packageInfo: T, outputListener: (data: string) => void): PromiseLike<void>;
    readonly available: boolean;
    packageAvailable(packageInfo: T): Promise<boolean>;
}
export default Backend;
