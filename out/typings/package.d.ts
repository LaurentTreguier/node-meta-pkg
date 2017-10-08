import * as util from './util';
interface Package {
    name: string;
    version?: string | util.FeedVersion;
    targets: string[];
    backends: {
        packagekit?: string | string[];
        brew?: string;
        chocolatey?: string;
        installer?: any;
        fallback?: any;
    };
}
export default Package;
