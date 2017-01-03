# MetaPkg

MetaPkg is a simple node module that can install software using already existing means such as package managers or using local installations.

|OS     |PackageKit|Native installer|Homebrew/Linuxbrew|Chocolatey|Fallback|
|-------|----------|----------------|------------------|----------|--------|
|Windows|          |planned         |                  |partial   |yes     |
|macOS  |          |planned         |yes               |          |yes     |
|Linux  |yes       |                |yes               |          |yes     |
|FreeBSD|yes       |                |                  |          |yes     |

## The structure of a package

Packages are simple JSONs. Two mains fields are required: `targets` and `backends`.
- `targets`: an array of filenames or executable commands that the package provides. If the `targets` are already present on the system when trying to install the package, then it will be considered already installed and meta-pkg will skip its installation.
- `backends`: an object containing the information for different backends. Nothing is necessary here. A package could be available only for macOS via a .pkg installer ; and another one for Windows via the fallback method, and on Linux and FreeBSD via PackageKit. Theorically a package could have no backend at all (though it would be stupid).

```json
{
    "targets": ["foobar"],
    "backends": {
        "packagekit": ["foobar", "FooBar"],
        "brew": "foobar",
        "installer": {
            "darwin": "www.example.com/downloads/foobar.dmg",
            "win32": "www.example.com/downloads/foobar.msi"
        },
        "fallback": {
            "name": "foobar",
            "version": "1.0.0",
            "linux": {
                "source": "www.example.com/downloads/foobar-%VERSION%.tar.gz",
                "version": {
                    "feed": "www.example.com/foobar.rss",
                    "regexp": "foobar-v([\\d.]+)",
                },
                "bin": "bin/foobar"
            },
            "win32": {
                "source": "www.example.com/downloads/foobar-%VERSION%.zip",
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
- `fallback` (`any`): downloads an archive and installs it locally. Binary files can be specified and will be linked in a directory which is automatically added to the `PATH` environment variable. After installing a package locally, these binaries can be used with the `child_process` module and such without worrying about their location.
  - `name` (`string`): the name that the local installation will use.
  - `version` (`string | any`, optional): the version of the software. It can be a fixed version number, but it can also be deduced from an RSS feed. This approach is generally better as packages can thus be versions-independant and won't need to be updated to follow the software's version.
    - `feed` (`string`): the URL of the feed. Tip: github generates feeds when adding '.atom' to some URLs (e.g. https://github.com/LaurentTreguier/node-meta-pkg/releases.atom).
    - `regexp` (`string | RegExp`): the regular expression that will be used to detect the version in the feed. The first parenthesis group will be the version number. It can be a `RegExp` object or a `string` for JSON compatibility.
    - `[OS identifier]` (`any`): the information needed for the specific OS to install the software.
      - `source` (`string`): the URL to get the software from. If needed, `%VERSION%` will be replaced by the version.
      - `strip` (`number`, optional): the number of leading directories to strip from the downloaded archive when decompressing it.
      - `bin` (`string | string[]`, optional): either a string or an array of names for the software's binaries. These will be linked in a single directory that contains binaries from everything that was installed this way.
      - `version` (optional): same as the above `version`, but can override it for a specific OS.
- `installer`: not yet implemented.

## API
This guide uses Typescript notations for types.

### `type PackageInfo = string | Package`
Represents a package either by its name if it is available in a repository, or by a raw package instance.

### `function isInstalled(packageInfo: PackageInfo): PromiseLike<boolean>`
Returns a `Promise` resolving `true` if the package is already installed and `false` otherwise.

### `function isUpgradable(packageInfo: PackageInfo): PromiseLike<boolean>`
Returns a `Promise` resolving `true` if the package can be upgraded and `false` otherwise. Only packages installed with the fallback method will be considered

### `function getInstallers(packageInfo: PackageInfo): : PromiseLike<Installer[]>`
Returns a `Promise` resolving an array of installers for the package represented by `packageInfo`.

### `function addRepo(url: string): void`
Adds a repository to fetch packages. Repositories are simple URLs that can provide packages when concatenating it with [packageName].json. `http://www.example.com/repo` is a valid repository URL if `http//www.example.com/repo/foobar.json` provides a package JSON.

### `function getFallbackBinLocation: string`
Returns the directory where binaries are linked when packages are installed through the fallback backend.

### `interface Package`
Members:
- `targets`
- `backends`
See the Backends paragraph just above.

### `interface Installer`
This interface has two members:
- `name`: the name of the backend used for this installer
- `function install(outputListener?: (data: string) => void): Promise<boolean>`: a function that returns a `Promise` which is resolved when the package is intalled ; the said promise return either `true` if the package was already installed and `false` otherwise. The `outputListener` parameter is an optional function that will receive the process' output when installing the package (useful for displaying progress information)

## Usage with Typescript
As this module is written in Typescript, typings are automatically generated and it can be used with no additional setup.

## Known issues

The Chocolatey backend will not output anything during installation. The installation itself should still work fine however.