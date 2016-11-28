declare abstract class Backend {
    readonly abstract prettyName: string;
    readonly abstract name: string;
    readonly abstract command: string;
    readonly abstract platforms: string[];
    abstract install(packageInfo: any): PromiseLike<void>;
    readonly available: boolean;
}
export default Backend;
