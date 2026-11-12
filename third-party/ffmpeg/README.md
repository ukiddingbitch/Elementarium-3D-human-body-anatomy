# FFmpeg corresponding source

This folder is shipped as ordinary files in native releases at
`resources/third-party/ffmpeg`. It contains the matching upstream source,
Electron patches in application order, build arguments and version evidence.

Electron: v45.3.0. Chromium: 156.0.8078.96. FFmpeg revision:
`9db86ce5b5b454dfc96c435f9f0723012980c37f`.

Archive SHA256: `af7e69539f7346e6d384ce95513c3736aae5a470fbcd66f591f0519ddee08c5a`.
Source: https://chromium.googlesource.com/chromium/third_party/ffmpeg/+archive/9db86ce5b5b454dfc96c435f9f0723012980c37f.tar.gz

Extract the archive, then apply `electron-patches/.patches` in listed order.
The two DEPS files record the pinned Electron and Chromium dependencies.
Use the Electron v45.3.0 source build with its normal dependency checkout and
FFmpeg arguments from `electron-patches/ffmpeg.gn`; see the exact-version
build instructions: https://github.com/electron/electron/blob/v45.3.0/docs/development/build-instructions-gn.md
The complete Electron source is https://github.com/electron/electron/tree/v45.3.0.
Building requires the platform toolchain and remaining Chromium dependencies;
the offline archive here is the corresponding FFmpeg source, not a complete
offline Chromium build environment.

The distributed FFmpeg shared library is LGPL 2.1 (COPYING.LGPLv2.1).
Windows: replace `ffmpeg.dll` next to Elementarium.exe. Linux: replace
`libffmpeg.so` next to the elementarium executable. Back up the original and
use an ABI-compatible build for the same Electron version/architecture.
You may modify/relink this library and reverse engineer for debugging those
modifications as provided by LGPL 2.1; Elementarium imposes no restriction.
Source files with other optional licenses retain their notices in the archive;
their presence in source does not mean GPL-only options are enabled in binary.
