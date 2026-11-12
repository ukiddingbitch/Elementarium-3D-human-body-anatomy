# Build Elementarium

Use Node.js 22.12 or newer; CI uses Node.js 24. Build-tool versions are pinned
in the lockfiles. Initial dependency downloads need a connection.

## Windows desktop installer

Run on Windows:

```sh
npm ci
node node_modules/electron/install.js
npm run dist
```

The English MSI installer is written to `dist/`. End users do not need
Python, Node.js or a local HTTP server for the desktop application.

## Debian installer

Node.js and Python 3 are packaging dependencies. Both Windows and Linux can
prepare the package:

```sh
npm ci
npm run dist:linux:dir
python packaging/build_deb.py
```

Use `python3` where required. The builder reads `dist/linux-unpacked` and
writes `dist/elementarium_3.3.1-1_amd64.deb`. Intermediate archives are under
`.build/deb`, which Git ignores. The package includes a desktop menu entry,
icon, dependency metadata, sandbox helper, AppArmor profile and uninstall scripts.
Targets: Ubuntu 22.04+, Mint 21+ and Debian 12+ with an x86-64 desktop.
Package structure was checked on Windows; a live Linux launch was not tested.

## Anatomy atlas

```sh
npm ci --prefix anatomy-source
npm run test:anatomy
npm run build:anatomy
```

The helper builds with relative URLs, checks for bundled models and replaces
`content/anatomy` with the result. The built browser app is committed so users
do not need atlas build dependencies. The decoder copy script runs during
dependency installation. To regenerate curated Slovak terminology:

```sh
python anatomy-source/tools/build-sk-names.py
```

## Windows browser launcher

The prepared browser release contains an embedded Python 3.12 runtime,
the files from `content/`, `browser/server.py` under `tools/`, and the compiled
`browser/Launcher.cs` as `Elementarium.exe`.

Compile with the Windows .NET Framework C# compiler:

```powershell
& "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /win32icon:icon.ico /out:Elementarium.exe browser\Launcher.cs
```

Keep the embedded Python runtime and its original license in `runtime/`.
Compiled launchers and runtimes belong in release downloads, not source Git.

The launcher probes ports by binding, reuses only a server with the expected
content fingerprint, and remembers its selected port under
`%LOCALAPPDATA%\ElementariumBrowser\port.txt`. It never stops unrelated services.
`browser/tests/LauncherChecks.cs` tests this routing and real launcher startup
with an isolated preference path and the embedded runtime. Compile it alongside
`browser/Launcher.cs` with `/target:exe /main:Elementarium.LauncherChecks` and the
same Windows Forms/Drawing references; pass the prepared browser folder and an
empty test-output folder as its two arguments.

## Verification

`npm test` checks the local protocol, 118-element data, translations, electron
populations and browser delivery, including all seven model files.
`npm run test:anatomy` runs atlas unit tests.

`qa.cjs` provides desktop integration checks. Set `ELEMENTARIUM_QA_DIR` to an
existing output directory and run the development Electron app to use it.
This mode is disabled in packaged applications.

## Model source and conversion

The seven committed GLBs retain named structures and can be edited in Blender.
See anatomy-source/tools/FULL_ATLAS_INPUTS.md for the audited conversion inputs
and build-full-atlas.mjs. Do not run the superseded reduced-BodyParts generator:
it does not preserve the original 2,827-object index.
