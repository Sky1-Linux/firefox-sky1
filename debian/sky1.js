// Sky1 Linux Firefox configuration
// Enable V4L2-M2M hardware video decoding

// Enable AV1 codec support
pref("media.av1.enabled", true);

// Force hardware video decoding
pref("media.hardware-video-decoding.force-enabled", true);

// Disable VA-API (use V4L2-M2M directly)
pref("media.ffmpeg.vaapi.enabled", false);

// Disable bundled ffvpx, use system FFmpeg with V4L2-M2M
pref("media.ffvpx.enabled", false);
