import Package from './package';
import Backend from './backend';
export declare function getInstallers(packageInfo: string | Package): PromiseLike<Installer[]>;
export declare function addRepo(repo: string): void;
export declare class Installer {
    private _backend;
    private _package;
    readonly name: string;
    constructor(backend: Backend, pkg: any);
    install(): PromiseLike<void>;
}
