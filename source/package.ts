'use strict';

interface Package {
    targets: string[];
    backends: {
        packagekit?: string[],
        brew?: string,
        chocolatey?: string
    };
};

export default Package;