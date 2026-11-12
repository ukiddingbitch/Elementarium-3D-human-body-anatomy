# Elementarium

An interactive periodic table and 3D anatomy atlas for the browser, Windows
and Linux. Explore 118 elements, compare properties, view electron models and
calculate light frequencies, and connect chemistry with seven anatomical systems.

All learning content, models, fonts and decoders are bundled. The desktop app
keeps the periodic table and anatomy atlas in the same window. Browser mode
remains available independently of the desktop app.

## Run in a browser

With Node.js 22.12 or newer installed:

```sh
npm run browser
```

This command needs no `npm install` and works without an internet connection.
It opens the default browser at `http://127.0.0.1:17868`. Keep the process
running while using the app. Press Ctrl+C to stop it. To choose another port:

```sh
npm run browser -- --port 17869
```

The ready-to-use **Elementarium_Browser_Windows** release includes Python and a
graphical launcher. Extract the complete folder and double-click
`Elementarium.exe`; no terminal or separate runtime installation is needed.
Keep its control window running and use **Quit** when finished.

The `content` folder can also be served by a static HTTP server. Opening
`content/index.html` directly as a `file://` URL is not supported because the
app uses modules and local data requests.

## Desktop releases

- **Windows 11, x64:** install `Elementarium-3.3.1-Setup.msi`. The installer and
  uninstaller are in English. Choose a destination folder and follow Next /
  Install / Finish. On the last page, select **Launch Elementarium** to open it
  immediately, or clear that option to start it later.
- **Ubuntu / Linux Mint / Debian, x86-64:** install
  `elementarium_3.3.1-1_amd64.deb` using the distribution's package installer.
  Missing system libraries may need to be installed once. Application content
  is already bundled. The Linux package has been structurally verified;
  a live Linux installation and launch have not been tested here.

The Windows and Linux installers belong in **GitHub Releases**, separately
from this source repository. See [the upload guide](docs/GITHUB.md).

## Languages and controls

Slovak, English, Italian and Latin share one application-wide preference.
The desktop app uses one picker in the top navigation. Standalone browser
pages use their own pickers in the table, element detail or atlas. Changes
update the other views and persist between launches. Anatomy labels come
from the source terminology plus editorial translations; original source
descriptions retain an explicit language label.
The Slovak anatomy dictionary covers 953 of 1,643 distinct base labels;
specialized labels without a Slovak entry retain their English source name.
Italian and Latin label tables cover the full index, with the two unidentified
objects explicitly left unidentified.

Isolate automatically centres and frames the selected structure. Inline action
icons have translated tooltips and fixed slots. Hidden parts stay in the list
and can be restored. Resize the list using its edge or expand button.

The atlas contains all **2,827 original selectable objects**: 277 skeletal,
349 joint, 669 muscular, 676 cardiovascular, 158 lymphatic, 580 nervous and
118 visceral. Fourteen small nerve courses are newly authored illustrations,
labelled in the detail. Two unidentified source objects remain unidentified.
This is an educational adaptation, not an exhaustive or clinical reference.

The mirrored-surface correction is checked against the exact models from the
[reference atlas](https://nqwrc.github.io/3d-anatomy/). See the
[rendering review](docs/RENDERING_REVIEW.md) and
[muscular-system comparison](docs/muscular-comparison.png).

## Saved anatomy views

Use the arrow beside each system to fold its list. The checkbox controls its
3D visibility independently. List folding is retained when changing languages.

Choose **Save view**, enter your own preset name, then choose **Save current
view**. **My views** lets you load, rename or delete a preset. Views preserve
individual visibility, exact transparency, selection, ghosting, isolation,
depth control and camera settings. They use local IndexedDB storage and remain
available after closing and restarting the application. Loading a view retains
the current application language.

Use **Export backup** to keep a portable JSON copy and **Import views** to
restore it or transfer it to another edition. Duplicate names get a numerical
suffix, so an import does not overwrite existing views. Browser storage belongs
to its browser profile and local address; clearing site data removes it. Keep
an exported copy of views you want to retain independently of that profile.
The prepared Windows browser launcher keeps one stable local address.
It checks port availability directly and remembers a different usable port
automatically if its preferred address is occupied. In the desktop app,
use the single language picker in the top navigation. Standalone browser
pages retain their own language controls.

Facial VII now includes its six source components on each side. Facial and
accessory nerve placement uses a shared skeletal registration instead of
stretching individual source trunks. See [the alignment review](docs/NERVE_ALIGNMENT.md).

## Screenshots

The screenshots below are captured from the finished local application.

![Periodic table](docs/periodic-table.png)

![Element detail](docs/element-detail.png)

![Restored anatomy atlas](docs/anatomy-atlas.png)

![Muscular system with both fascia surfaces](docs/muscular-front.png)

![Automatic isolation framing](docs/isolation.png)

![Named saved anatomy views](docs/saved-views.png)

## Development

```sh
npm ci
npm start
npm test
npm ci --prefix anatomy-source
npm run test:anatomy
npm run build:anatomy
```

Initial build-tool downloads need a connection; prepared editions include their
content for offline use. See [BUILD.md](BUILD.md) and the
[GitHub upload guide](docs/GITHUB.md). Source, screenshots and component notices
belong in the repository; installers belong in GitHub Releases.

## Licenses and attribution

Viewer/application code: CC BY-NC-SA 4.0. Adapted geometry: CC BY-SA 4.0,
with underlying CC BY/CC BY-SA source credits preserved. Text, terminology,
libraries and runtimes keep their component terms. Read [LICENSE](LICENSE),
[NOTICE](NOTICE) and the [restoration review](docs/LICENSE_AUDIT.md).

Z-Anatomy; BodyParts3D, © The Database Center for Life Science; Brain for Blender,
Anderson M. Winkler; HRA / HuBMAP; OpenEar contributors. Registered replacement
data adaptations are credited in NOTICE. Screenshot model renderings retain
the applicable model attribution and ShareAlike terms.
