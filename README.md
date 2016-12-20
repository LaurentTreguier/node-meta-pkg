# Meta-pkg

Meta-pkg is a simple node module that can install software using native means.

|OS|PackageKit|Download|Homebrew/Linuxbrew|Chocolatey|Fallback|
|---|---|---|---|---|---|
|Windows||planned||partial|planned|
|MacOS||planned|yes||planned|
|Linux|yes|planned|yes||planned|
|FreeBSD|yes||||planned|

## The structure of a package

Packages are simple JSON files. Two mains fields are required: `targets` and `backends`.
- `targets`: an array of filenames or executable commands that the package provides. If the `targets` are already present on the system when trying to install the package, then it will be considered already installed and meta-pkg will skip its installation.
- `backends`: an object containing the information for different backends. Nothing is necesary here. A package could be available only for MacOS via a `.pkg` installer ; and another one for Windows via the fallback method, and on Linux and FreeBSD via PackageKit. Theorically a package could have no backend at all (which is pretty stupid).

```json
{
    "targets": ["foobar"],
    "backends": {
        "packagekit": ["foo", "Foo"],
        "download": {
            "darwin": "www.example.com/downloads/foobar-1.0.0.dmg",
            "win32": "www.example.com/downloads/foobar-1.0.0.msi",
            "linux": "www.example.com/downloads/foobar-1.0.0.rpm"
        },
        "brew": "foobar"
    }
}
```

## Backends

- `packagekit`: this backend leverages PackageKit to install software on Linux and FreeBSD smoothly in a cross-distro manner. However, as package names can still be different between distros, an array of possible package names is required.
- `brew`: uses Homebrew on MacOS and Linuxbrew on Linux. Here only a single package name is required as brew packages don't depend on the distro.

The rest of the backends will be documented when they are actually implemented.

## API
As the API is written in Typescript, typings are automatically generated and provided with the module.

### `function getInstallers(packageName: string): Installer[]`
Returns an array of installers for the package with the name `packageName`.

### `function getInstallers(p: Package): Installer[]`
Returns an array of installers for the package.

### `function addRepo(url: string): void`
Adds a repository to fetch packages. A repository are simply URLs that can provide packages when concatenating it with [packageName].json. `http://www.example.com/repo` is a valid repository URL if `http//www.example.com/repo/foobar.json` is a pakage JSON.

### `type PackageInfo = string | Package`
Represents a package either by its name if it is available in a repository, or by a raw package instance.

### `interface Package`
Members:
- `targets`
- `backends`
See the Backends paragraph just above.

### `interface Installer`
This interface has two members:
- `name`: the name of the backend used for this installer
- `install(outputListener?: (chunk) => void)`: a function that returns a `Promise` which is resolved when the package is intalled ; the said promise return either false if the package is already installed or true after the package is installed. The `outputListener` parameter is an optional function that will receive the process' output chnk by chunk when installing the package (useful for displaying progress information)

## Known issues

The Chocolatey backend will not output anything during installation. The installation itself should still work fine.