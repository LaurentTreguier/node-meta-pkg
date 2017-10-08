export interface BasicInfo {
    name: string;
    version?: string | FeedVersion;
}
export interface FeedVersion {
    feed: string;
    regexp: string | RegExp;
}
export declare function checkExistence(command: string): boolean;
export declare function getInfo(packageInfo: any): any;
export declare function retrieveLatestVersion(version: FeedVersion, outputListener?: (data: string) => void): Promise<{}>;
