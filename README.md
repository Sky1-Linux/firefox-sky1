# Firefox Sky1

Debian packaging for Firefox with V4L2-M2M hardware video decoding prioritized over VA-API.

## Overview

This repository contains Debian packaging patches for Firefox that enable V4L2-M2M hardware video decoding on ARM platforms like the CIX Sky1/Orion O6.

## Patches

- **Prefer-V4L2-M2M-over-VAAPI-for-hw-decode.patch**: Makes Firefox try V4L2-M2M hardware decoding before falling back to VA-API
- **Fix-V4L2-M2M-timestamp-handling.patch**: Fixes timestamp handling for V4L2 stateful decoders that don't set proper PTS/duration on output frames
- **Add-V4L2-M2M-AV1-decoder-support.patch**: Adds av1_v4l2m2m to the list of V4L2-M2M decoders (Firefox only had H264, VP8, VP9, HEVC)

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

For incremental rebuilds after patching (2 minutes vs 3.5 hours), see [docs/firefox-incremental-rebuild.md](docs/firefox-incremental-rebuild.md).

## Requirements

- System FFmpeg with V4L2-M2M decoders (ffmpeg-sky1 or similar)
- V4L2 video decoder device (/dev/video0)
