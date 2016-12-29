'use strict';

interface Package {
    targets: string[];
    backends: {
        packagekit?: string | string[],
        brew?: string,
        chocolatey?: string,
        fallback?: any
    };
};

export default Package;