import * as util from './util';
declare abstract class Backend<T> {
    abstract readonly name: string;
    abstract readonly prettyName: string;
    abstract readonly command: string;
    abstract readonly platforms: string[];
    abstract install(basicInfo: util.BasicInfo, packageInfo: T, outputListener: (data: string) => void): PromiseLike<void>;
    readonly available: boolean;
    packageAvailable(packageInfo: T): Promise<boolean>;
}
export default Backend;
