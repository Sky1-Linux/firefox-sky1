# Firefox Sky1

Debian packaging for Firefox with V4L2-M2M hardware video decoding prioritized over VA-API.

## Overview

This repository contains Debian packaging patches for Firefox that enable V4L2-M2M hardware video decoding on ARM platforms like the CIX Sky1/Orion O6.

## Key Changes

- **V4L2-M2M Priority**: Firefox tries V4L2-M2M hardware decoding before falling back to VA-API
- **System FFmpeg**: Uses system FFmpeg with V4L2-M2M wrapper decoders (h264_v4l2m2m, hevc_v4l2m2m, vp9_v4l2m2m, av1_v4l2m2m)

## Building

1. Get Firefox source:
```bash
apt-get source firefox
cd firefox-*/
```

2. Apply patches from this repo:
```bash
cp -r /path/to/firefox-sky1/debian .
quilt push -a
```

3. Build:
```bash
dpkg-buildpackage -us -uc -b
```

## Incremental Rebuild

If you have an existing build and only need to apply the V4L2-M2M patch:

```bash
cd firefox-build-dir
patch -p1 < debian/patches/debian-hacks/Prefer-V4L2-M2M-over-VAAPI-for-hw-decode.patch
./mach build
```

## Requirements

- System FFmpeg with V4L2-M2M decoders (ffmpeg-sky1 or similar)
- V4L2 video decoder device (/dev/video0)
