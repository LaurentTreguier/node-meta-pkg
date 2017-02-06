declare abstract class Backend<T> {
    readonly abstract name: string;
    readonly abstract prettyName: string;
    readonly abstract command: string;
    readonly abstract platforms: string[];
    abstract install(name: string, packageInfo: T, outputListener: (data: string) => void): PromiseLike<void>;
    readonly available: boolean;
    packageAvailable(packageInfo: T): Promise<boolean>;
}
export default Backend;
