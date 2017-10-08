# MetaPkg

MetaPkg is a simple node module that can install software using already existing means such as package managers or using local installations.

|OS     |PackageKit|Native installer|Homebrew/Linuxbrew|Chocolatey         |Fallback|
|-------|----------|----------------|------------------|-------------------|--------|
|Windows|          |planned         |                  |partial (see issue)|yes     |
|macOS  |          |planned         |yes               |                   |yes     |
|Linux  |yes       |                |yes               |                   |yes     |
|FreeBSD|yes       |                |                  |                   |yes     |

## The structure of a package

Packages are simple JSONs. Two mains fields are required: `targets` and `backends`.
- `targets`: an array of filenames or executable commands that the package provides. If the `targets` are already present on the system when trying to install the package, then it will be considered already installed and meta-pkg will skip its installation.
- `backends`: an object containing the information for different backends. Nothing is necessary here. A package could be available only for macOS via a .pkg installer ; and another one for Windows via the fallback method, and on Linux and FreeBSD via PackageKit. Theorically a package could have no backend at all (though it would be stupid).

```json
{
    "name": "foobar",
    "targets": ["foobar"],
    "backends": {
        "packagekit": ["foobar", "FooBar"],
        "brew": "foobar",
        "installer": {
            "version": "1.0.0",
            "darwin": "www.example.com/downloads/foobar-%VERSION%.dmg",
            "win32": "www.example.com/downloads/foobar.msi"
        },
        "fallback": {
            "version": "1.0.0",
            "linux": {
                "source": "www.example.com/downloads/foobar-src-%VERSION%.tar.gz",
                "build": [
                    { "mkdir build": "" },
                    { "cmake ..": "build" },
                    { "make": "build" }
                ],
                "bin": "bin/foobar"
            },
            "win32": {
                "source": "www.example.com/downloads/foobar-bin-%VERSION%.zip",
                "version": {
                    "feed": "www.example.com/foobar.rss",
                    "regexp": "foobar-v([\\d.]+)",
                },
                "bin": "bin/foobar.exe"
            }
        }
    }
}
```

## Backends

- `packagekit` (`string | string[]`): this backend leverages PackageKit to install software on Linux and FreeBSD smoothly in a cross-distro manner. However, as package names can still be different between distros, an array of different possible package names can be specifie when necessary.
- `brew` (`string`): uses Homebrew on macOS and Linuxbrew on Linux. Here only a single package name is required as brew packages don't depend on the distro.
- `chocolatey` (`string`): uses Chocolatey to install software on Windows. Just like for `brew`, only a single package name is required.
- `installer`: not yet implemented.
- `fallback` (`any`): downloads an archive and installs it locally. Binary files directories can be specified and will be automatically added to the `PATH` environment variable. After installing a package locally, these binaries can be used with the `child_process` module and such without worrying about their location.
  - `name` (`string`): the name that the local installation will use.
  - `source` (`string`, optional): the source URL to download the software from.
  - `version` (`string | any`, optional): the version of the software. It can be a fixed version number, but it can also be deduced from an RSS feed. This approach is generally better as packages can thus be versions-independant and won't need to be updated to follow the software's version.
    - `feed` (`string`): the URL of the feed. Tip: github generates feeds when adding '.atom' to some URLs (e.g. https://github.com/LaurentTreguier/node-meta-pkg/releases.atom).
    - `regexp` (`string | RegExp`): the regular expression that will be used to detect the version in the feed. The first parenthesis group will be the version number. It can be a `RegExp` object or a `string` for JSON compatibility.
  - `strip` (`number`, optional): the number of leading directories to strip from the downloaded archive when decompressing it.
  - `build` (`Array<any>`, optional): a list of shell commands to build the package. Each object contains a set of instructions that will be executed in parallel. The keys used are the commands, and the values are the directories in which those commands are executed. These directories are relative to the package root.
  - `bin` (`string | string[]`, optional): either a string or an array of names for the software's binaries directories. These will be added to the `PATH` environment variable automatically.
  - `darwin | freebsd | linux | win32` (`string | any`): the information needed for the specific OS to install the software. It can either be a source URL, or an object containing a source URL and potentially overriding `version`, `bin` or `strip` for the specific OS.
    - `source` (optional): same as the above `version`, but can override it for a specific OS.
    - `version` (optional): same as the above `version`, but can override it for a specific OS.
    - `build` (optional): same as the above `build`, but can override it for a specific OS.
    - `bin` (optional): same as the above `bin`, but can override it for a specific OS.
    - `strip` (optional): same as the above `strip`, but can override it for a specific OS.

## API
This document uses Typescript notation.

### `type PackageInfo = string | Package`
Represents a package either by its name if it is available in a repository, or by a raw package instance.

### `function registerPackage(pkg: Package): void`
Registers a package for later use. Packages can be used simply with their name after being registered.

### `function isInstalled(packageInfo: PackageInfo): Promise<boolean>`
Returns a `Promise` resolving `true` if the package is already installed and `false` otherwise.

### `function isUpgradable(packageInfo: PackageInfo): Promise<boolean>`
Returns a `Promise` resolving `true` if the package can be upgraded and `false` otherwise. Only packages installed with the fallback method will be considered

### `function getInstallers(packageInfo: PackageInfo): : Promise<Installer[]>`
Returns a `Promise` resolving an array of installers for the package represented by `packageInfo`.

### `function addRepo(url: string): void`
Adds a repository to fetch packages. Repositories are simple URLs that can provide packages when concatenating it with [packageName].json. `http://www.example.com/repo` is a valid repository URL if `http//www.example.com/repo/foobar.json` provides a package JSON.

### `function getFallbackPackagesPath: string`
Returns the directory where packages are installed when using the fallback backend.

### `interface Package`
Members:
- `name: string`
- `targets: string[]`
- `backends: any`
See the Backends paragraph just above.

### `interface Installer`
This interface has two members:
- `name: string`: the name of the backend used for this installer as used in the package JSON
- `prettyName: string`: the prettified name of the backend used for this installer
- `function install(outputListener?: (data: string) => void): Promise<boolean>`: a function that returns a `Promise` which is resolved when the package is intalled ; the said promise return either `true` if the package was already installed and `false` otherwise. The `outputListener` parameter is an optional function that will receive the process' output when installing the package (useful for displaying progress information)

## Usage with Typescript
As this module is written in Typescript, typings are automatically generated and it can be used with no additional setup.

## Known issues
- The Chocolatey backend will not output anything during installation. The installation itself should still work fine however.
- Version 0.5.0 depends on the `lzma-native` module, which can cause problems in some scenarios. For instance, it can not be used in Visual Studio Code.
- A lot of earlier versions can be bugged due to forgetting to regenerate typings or javascript output.

## TODO
- Add a dependency system (especially for the fallback build system)
- Add the native installer backend