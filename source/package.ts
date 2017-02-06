'use strict';

interface Package {
    name: string;
    targets: string[];
    backends: {
        packagekit?: string | string[];
        brew?: string;
        chocolatey?: string;
        fallback?: any;
    };
};

export default Package;