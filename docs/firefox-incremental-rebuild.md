# Firefox Incremental Rebuild Guide

**Date:** December 2025
**Build Time:** ~2 minutes (vs 3.5 hours full build)

## Overview

This document describes how to perform an incremental rebuild of Firefox after patching a single source file, without requiring a full rebuild.

## When to Use

Use this method when:
- You've already completed a full Firefox build
- You only need to patch one or a few C++ source files
- The build directory (`build-browser/`) still exists with all artifacts

## Prerequisites

- Completed full Firefox build with `build-browser/` directory intact
- Original build log available (to extract compile/link commands)
- The patch only affects C++ source files (not build system, Rust, or JS)

## Process

### 1. Apply the Patch

```bash
cd ~/firefox-sky1
patch -p1 < debian/patches/debian-hacks/Prefer-V4L2-M2M-over-VAAPI-for-hw-decode.patch
```

### 2. Identify Affected Object Files

Firefox uses "unified builds" where multiple .cpp files are compiled together. Find which unified files include your patched file:

```bash
find ~/firefox-sky1/build-browser -name "Unified_cpp*ffmpeg*.cpp" \
  -exec grep -l "FFmpegVideoDecoder" {} \;
```

For FFmpegVideoDecoder.cpp, these are the affected unified files:
- `ffmpeg57/Unified_cpp_ffmpeg_ffmpeg570.o`
- `ffmpeg58/Unified_cpp_ffmpeg_ffmpeg580.o`
- `ffmpeg59/Unified_cpp_ffmpeg_ffmpeg590.o`
- `ffmpeg60/Unified_cpp_ffmpeg_ffmpeg600.o`
- `ffmpeg61/Unified_cpp_ffmpeg_ffmpeg610.o`
- `ffmpeg62/Unified_cpp_ffmpeg_ffmpeg620.o`
- `ffvpx/Unified_cpp_ffmpeg_ffvpx0.o`
- `libav53/Unified_cpp_ffmpeg_libav530.o`
- `libav54/Unified_cpp_ffmpeg_libav540.o`
- `libav55/Unified_cpp_ffmpeg_libav550.o`

### 3. Extract Compile Commands from Build Log

```bash
grep -a "Unified_cpp_ffmpeg" /path/to/build.log | grep "^/usr/bin/clang++" > /tmp/ffmpeg_compile_cmds.txt
```

### 4. Recompile Object Files

For each compile command, run it from the correct directory:

```bash
cd ~/firefox-sky1/build-browser/dom/media/platforms/ffmpeg/ffmpeg61
/usr/bin/clang++ -o Unified_cpp_ffmpeg_ffmpeg610.o -c [flags...] Unified_cpp_ffmpeg_ffmpeg610.cpp
```

Or use this script to automate:

```bash
#!/bin/bash
set -e
cd ~/firefox-sky1/build-browser

declare -A DIRS=(
  ["Unified_cpp_ffmpeg_ffmpeg570.o"]="dom/media/platforms/ffmpeg/ffmpeg57"
  ["Unified_cpp_ffmpeg_ffmpeg580.o"]="dom/media/platforms/ffmpeg/ffmpeg58"
  ["Unified_cpp_ffmpeg_ffmpeg590.o"]="dom/media/platforms/ffmpeg/ffmpeg59"
  ["Unified_cpp_ffmpeg_ffmpeg600.o"]="dom/media/platforms/ffmpeg/ffmpeg60"
  ["Unified_cpp_ffmpeg_ffmpeg610.o"]="dom/media/platforms/ffmpeg/ffmpeg61"
  ["Unified_cpp_ffmpeg_ffmpeg620.o"]="dom/media/platforms/ffmpeg/ffmpeg62"
  ["Unified_cpp_ffmpeg_ffvpx0.o"]="dom/media/platforms/ffmpeg/ffvpx"
  ["Unified_cpp_ffmpeg_libav530.o"]="dom/media/platforms/ffmpeg/libav53"
  ["Unified_cpp_ffmpeg_libav540.o"]="dom/media/platforms/ffmpeg/libav54"
  ["Unified_cpp_ffmpeg_libav550.o"]="dom/media/platforms/ffmpeg/libav55"
)

while IFS= read -r cmd; do
  obj=$(echo "$cmd" | grep -oP '(?<=-o )\S+\.o')
  dir="${DIRS[$obj]}"
  if [ -n "$dir" ]; then
    echo "=== Compiling $obj ==="
    cd ~/firefox-sky1/build-browser/$dir
    eval "$cmd"
  fi
done < /tmp/ffmpeg_compile_cmds.txt
```

### 5. Relink libxul.so

Extract the link command from the build log:

```bash
grep -a "libxul.so" /path/to/build.log | grep "clang++" | head -1 > /tmp/libxul_link.txt
```

Run from the correct directory:

```bash
cd ~/firefox-sky1/build-browser/toolkit/library/build
bash /tmp/libxul_link.txt
```

This outputs to `../../../dist/bin/libxul.so`.

### 6. Repackage the .deb

Extract the existing package, replace libxul.so, and rebuild:

```bash
# Extract existing deb
mkdir -p /tmp/firefox-repack && cd /tmp/firefox-repack
dpkg-deb -R ~/firefox_146.0-1+v4l2m2m.1_arm64.deb firefox-deb

# Strip debug symbols and copy new libxul.so
strip --strip-debug ~/firefox-sky1/build-browser/dist/bin/libxul.so \
  -o firefox-deb/usr/lib/firefox/libxul.so

# Rebuild package (increment version in filename)
dpkg-deb -b firefox-deb firefox_146.0-1+v4l2m2m.2_arm64.deb

# Copy to home
cp firefox_146.0-1+v4l2m2m.2_arm64.deb ~/
```

## Why Full mach/dpkg-buildpackage Doesn't Work

1. **Debian build uses temporary virtualenvs** - Paths like `/home/ent/firefox-sky1/debian/.mozbuild/srcdirs/firefox-sky1-5c6e2dafed13/_virtualenvs/build/bin/python` are created during `dpkg-buildpackage` and deleted after

2. **mach expects different objdir** - `mach` looks for `obj-aarch64-unknown-linux-gnu/` but Debian uses `build-browser/`

3. **Build system state is lost** - The `debian/control` file and other generated files are removed after packaging

## Limitations

- Only works for C++ source file changes
- Build log must be preserved from original build
- Rust changes require full rebuild
- Build system changes (moz.build) require full rebuild
- If you run `debian/rules clean`, you'll need a full rebuild

## Time Comparison

| Method | Time |
|--------|------|
| Full dpkg-buildpackage | ~3.5 hours |
| Incremental (this method) | ~2 minutes |

## Files Modified

For the V4L2-M2M patch:
- Source: `dom/media/platforms/ffmpeg/FFmpegVideoDecoder.cpp`
- Objects: 10 unified .o files in `build-browser/dom/media/platforms/ffmpeg/*/`
- Library: `build-browser/dist/bin/libxul.so`
- Package: `firefox_146.0-1+v4l2m2m.X_arm64.deb`
