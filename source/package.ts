'use strict';

interface Package {
    targets: string[];
    backends: {
        packagekit?: string[],
        brew?: string
    };
};

export default Package;