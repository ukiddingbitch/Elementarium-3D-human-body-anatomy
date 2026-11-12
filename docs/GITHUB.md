# Upload this project to GitHub

Read the component [LICENSE](../LICENSE), [NOTICE](../NOTICE) and
[remediation review](LICENSE_AUDIT.md). Keep the bundled source/notices intact;
the viewer code retains its NonCommercial terms.

Use the contents of the **Elementarium** folder as the repository root.
Include the hidden `.github`, `.gitignore`, `.gitattributes` and `.nvmrc` files.
Do not upload the parent `outputs` folder as the source repository.

Create an empty repository on GitHub, then upload this folder's contents or
publish the folder using your preferred Git client. No repository URL or
account-specific settings have been hard-coded.

The source includes the anatomy models so browser use does not depend on a CDN
or external model server. Each source file is below GitHub's normal file-size
limits. If uploading through the browser, use smaller batches when needed
and preserve the directory structure.

Attach the ready-built Windows `.msi` and Linux `.deb` packages, their README
files and checksums to a GitHub Release for version `v3.3.1`. Keep the prepared
browser release as a separate download if desired. Installers and embedded
runtimes are intentionally excluded from the source repository's Git rules.

GitHub Actions checks the browser app, element data, atlas tests and atlas
rebuild on pushes and pull requests. It does not publish a website or releases.

To host browser mode, deploy the contents of `content/` to a static HTTP host,
preserving its directory structure. A hosted version needs its server for the
initial page load; the local browser release works without a network connection.

Reference: [GitHub file-size and release guidance](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
