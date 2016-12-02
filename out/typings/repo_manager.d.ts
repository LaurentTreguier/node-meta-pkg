import Package from './package';
declare class RepoManager {
    private _repos;
    addRepo(repo: string): void;
    getPackage(packageName: string): PromiseLike<Package>;
}
export default RepoManager;
