"""Build a Debian 2.0 package from electron-builder's Linux directory output.

Uses only the Python standard library, so the same script works on Windows
and Linux. Linux ownership and executable permissions are set explicitly.
"""
from pathlib import Path, PurePosixPath
import gzip
import hashlib
import io
import json
import shutil
import tarfile
import time

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT
BINARY = ROOT / 'dist/linux-unpacked'
SCRATCH = ROOT / '.build/deb'
OUTPUT = ROOT / 'dist'
VERSION = json.loads((APP / 'package.json').read_text(encoding='utf-8-sig'))['version']
EPOCH = int(time.time())

POSTINST = '''#!/bin/sh
set -e
case "$1" in
  configure)
    # Upstream Chromium helper; retain the sandbox on systems without user namespaces.
    chown root:root /opt/Elementarium/chrome-sandbox
    chmod 4755 /opt/Elementarium/chrome-sandbox
    profile=/opt/Elementarium/resources/apparmor-profile
    if command -v apparmor_parser >/dev/null 2>&1 &&
       apparmor_parser --skip-kernel-load --debug "$profile" >/dev/null 2>&1; then
      install -m 0644 "$profile" /etc/apparmor.d/elementarium
      if ! { command -v ischroot >/dev/null 2>&1 && ischroot; }; then
        apparmor_parser --replace --write-cache --skip-read-cache /etc/apparmor.d/elementarium >/dev/null 2>&1 || true
      fi
    fi
    if command -v update-desktop-database >/dev/null 2>&1; then
      update-desktop-database -q /usr/share/applications || true
    fi
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
      gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
    fi
    ;;
esac
exit 0
'''
POSTRM = '''#!/bin/sh
set -e
case "$1" in
  remove|purge|disappear)
    if [ -f /etc/apparmor.d/elementarium ]; then
      if command -v apparmor_parser >/dev/null 2>&1; then
        apparmor_parser --remove /etc/apparmor.d/elementarium >/dev/null 2>&1 || true
      fi
      rm -f /etc/apparmor.d/elementarium
    fi
    if command -v update-desktop-database >/dev/null 2>&1; then
      update-desktop-database -q /usr/share/applications || true
    fi
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
      gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
    fi
    ;;
esac
exit 0
'''
APPARMOR = '''abi <abi/4.0>,
include <tunables/global>

profile "elementarium" "/opt/Elementarium/elementarium" flags=(unconfined) {
  userns,
  include if exists <local/elementarium>
}
'''
DESKTOP = '''[Desktop Entry]
Type=Application
Name=Elementarium
Comment=Interactive periodic table and 3D anatomy atlas
Exec=/opt/Elementarium/elementarium %U
TryExec=/opt/Elementarium/elementarium
Icon=elementarium
Terminal=false
Categories=Education;Science;Chemistry;
StartupNotify=true
StartupWMClass=Elementarium
'''
DEPENDS = ', '.join([
    'libc6 (>= 2.35)', 'libgcc-s1', 'libstdc++6',
    'libgtk-3-0t64 | libgtk-3-0', 'libnotify4', 'libnss3', 'libnspr4',
    'libxss1', 'libxtst6', 'xdg-utils', 'libatspi2.0-0t64 | libatspi2.0-0',
    'libuuid1', 'libsecret-1-0', 'libasound2t64 | libasound2', 'libgbm1',
    'libxkbcommon0', 'libx11-6', 'libxcb1', 'libxcomposite1', 'libxdamage1',
    'libxext6', 'libxfixes3', 'libxrandr2', 'libdrm2',
    'libglib2.0-0t64 | libglib2.0-0', 'libdbus-1-3', 'libudev1',
])

def metadata(name, size=0, mode=0o644):
    item = tarfile.TarInfo('./' + name)
    item.size, item.mode, item.mtime = size, mode, EPOCH
    item.uid = item.gid = 0
    item.uname = item.gname = 'root'
    return item

def digest(source, algorithm):
    result = hashlib.new(algorithm)
    with source.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()

def add_bytes(archive, name, contents, mode=0o644):
    if isinstance(contents, str):
        contents = contents.encode('utf-8')
    archive.addfile(metadata(name, len(contents), mode), io.BytesIO(contents))

def write_ar(output, members):
    with output.open('wb') as stream:
        stream.write(b'!<arch>\n')
        for name, file in members:
            size = file.stat().st_size
            header = f'{name + "/":<16}{EPOCH:<12}{0:<6}{0:<6}{"100644":<8}{size:<10}`\n'
            assert len(header) == 60
            stream.write(header.encode('ascii'))
            with file.open('rb') as source:
                shutil.copyfileobj(source, stream, 1024 * 1024)
            if size % 2:
                stream.write(b'\n')

def main():
    executable = BINARY / 'elementarium'
    with executable.open('rb') as file:
        header = file.read(20)
    assert header[:6] == b'\x7fELF\x02\x01' and int.from_bytes(header[18:20], 'little') == 62, 'Expected Linux x86-64 ELF'
    SCRATCH.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    files = []
    for source in sorted(BINARY.rglob('*')):
        if not source.is_file():
            continue
        assert not source.is_symlink(), f'Unexpected symlink: {source}'
        name = 'opt/Elementarium/' + source.relative_to(BINARY).as_posix()
        with source.open('rb') as stream:
            elf = stream.read(4) == b'\x7fELF'
        mode = 0o4755 if source.name == 'chrome-sandbox' else 0o755 if elf else 0o644
        files.append((name, source, mode))
    files.append(('usr/share/icons/hicolor/256x256/apps/elementarium.png', APP / 'icon.png', 0o644))
    extra = {
        'opt/Elementarium/resources/apparmor-profile': APPARMOR,
        'usr/share/applications/elementarium.desktop': DESKTOP,
        'usr/share/doc/elementarium/README.txt': (Path(__file__).parent / 'Linux_README.txt').read_text(encoding='utf-8'),
        'usr/share/doc/elementarium/copyright': (
            'Elementarium: bundled chemistry and anatomy learning application.\n'
            'See /opt/Elementarium/resources/licenses for the component LICENSE and NOTICE.\n'
            'See /opt/Elementarium/LICENSE.electron.txt and LICENSES.chromium.html for Electron/Chromium licenses.\n\n'
            + (APP / 'NOTICE').read_text(encoding='utf-8')
        ),
    }
    paths = [name for name, _, _ in files] + list(extra) + ['usr/bin/elementarium']
    directories = set()
    for name in paths:
        directories.update(str(parent) for parent in PurePosixPath(name).parents if str(parent) != '.')
    sums = []
    installed_size = sum(file.stat().st_size for _, file, _ in files)
    with gzip.GzipFile(filename=str(SCRATCH / 'data.tar.gz'), mode='wb', compresslevel=6, mtime=EPOCH) as compressed:
        with tarfile.open(fileobj=compressed, mode='w|', format=tarfile.GNU_FORMAT) as archive:
            for name in sorted(directories, key=lambda value: (value.count('/'), value)):
                item = metadata(name, mode=0o755)
                item.type = tarfile.DIRTYPE
                archive.addfile(item)
            for name, file, mode in files:
                with file.open('rb') as source:
                    archive.addfile(metadata(name, file.stat().st_size, mode), source)
                sums.append(f'{digest(file, "md5")}  {name}\n')
            for name, text in extra.items():
                add_bytes(archive, name, text)
                sums.append(f'{hashlib.md5(text.encode()).hexdigest()}  {name}\n')
                installed_size += len(text.encode())
            link = metadata('usr/bin/elementarium', mode=0o777)
            link.type, link.linkname = tarfile.SYMTYPE, '/opt/Elementarium/elementarium'
            archive.addfile(link)
    control = f'''Package: elementarium
Version: {VERSION}-1
Section: education
Priority: optional
Architecture: amd64
Maintainer: Elementarium
Installed-Size: {(installed_size + 1023) // 1024}
Depends: {DEPENDS}
Description: Interactive periodic table and 3D anatomy atlas
 Explore 118 chemical elements and seven anatomical systems in one desktop
 application. All learning content, 3D models, fonts and decoders are bundled.
 One language setting covers Slovak, English, Italian and Latin across
 the periodic table and anatomy atlas. No local server is required.
'''
    with tarfile.open(SCRATCH / 'control.tar.gz', 'w:gz', format=tarfile.GNU_FORMAT) as archive:
        add_bytes(archive, 'control', control)
        add_bytes(archive, 'md5sums', ''.join(sums))
        add_bytes(archive, 'postinst', POSTINST, 0o755)
        add_bytes(archive, 'postrm', POSTRM, 0o755)
    (SCRATCH / 'debian-binary').write_bytes(b'2.0\n')
    package = OUTPUT / f'elementarium_{VERSION}-1_amd64.deb'
    write_ar(package, [(name, SCRATCH / name) for name in ['debian-binary', 'control.tar.gz', 'data.tar.gz']])
    print(json.dumps({'package': str(package), 'bytes': package.stat().st_size, 'sha256': digest(package, 'sha256')}, indent=2))

if __name__ == '__main__':
    main()
