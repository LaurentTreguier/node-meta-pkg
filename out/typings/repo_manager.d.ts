import Package from './package';
declare class RepoManager {
    private _repos;
    addRepo(repo: string): void;
    getPackage(packageName: string): Promise<Package>;
}
export default RepoManager;
