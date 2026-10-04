# CAMERAS: live for investors, time-lapse for the site, frames for the AI

Decided 4 October 2026. Three outputs from one set of cameras.

## 1. Live stream, private

- Platform: YouTube Live, unlisted. Free, stable, archives every stream automatically.
- Audience: the private WhatsApp group of investors in that batch, plus the owner of the house. The website never embeds the live feed.
- Source: the two fixed IP cameras on poles at opposite corners (one wide on the whole lot, one on the entrance and the delivery zone) and one PTZ. RTSP from the cameras to a small box on site (Raspberry Pi 4 or an Intel NUC) running ffmpeg, which pushes RTMP to YouTube. Cameras that speak RTMP natively skip the box.
- Uplink: 4G router with an external antenna, or fibre if the loteamento has it. Budget 60 to 80 GB a month per stream at 1080p; stream at 720p if the plan is tight.
- Hours: stream only during working hours; the box starts and stops on a schedule so the archive is clean and the data plan survives.
- LGPD: signage at the gate and on the fence, consent line in crew onboarding, no audio.

## 2. Time-lapse, public after handover

Recommendation, in order:

1. **Brinno construction camera kit** (BCC2000 series or the current equivalent, check the model before buying). Standalone, weatherproof housing, runs for months on batteries at long intervals, writes the finished time-lapse to an SD card. One per lot, pointed from the best corner. Imported, a few thousand reais. It is the lowest-friction way to guarantee a clean 60 to 90 second video of every build without depending on the uplink or the box.
2. **Frames from the IP cameras** (see §3). Free, and it gives you a second angle for every build. Assemble with ffmpeg at 24 frames a second from the 10-minute stills: a 30-day build at 10 hours a day is about 1,800 frames, 75 seconds of video.
3. **Enterprise construction-camera services** (EarthCam, OxBlue, TrueLook, Evercam and similar) are built for large sites and priced accordingly. Not for a 30-day house. Revisit if the Max becomes a programme.

Publish each finished time-lapse on the Kiver Build YouTube channel, public, and add one entry to `data/shared/timelapses.json`. The gallery section on every model page renders the entries for that model and hides itself while the list is empty.

## 3. Frames for the AI review

The live video is for people. The dataset is stills.

- Every IP camera saves a JPEG every 10 minutes during working hours to an object store (Cloudflare R2 or S3) under `site/{build_id}/{camera}/{YYYY-MM-DD}/{HHMM}.jpg`.
- A small script tags each frame with the working day and the activities active that day from `data/models/{model}.json`, writing a sidecar JSON. That tag is what makes the frames trainable later: "day 13, tilt-up, crew 8" next to the image.
- Keep the frames forever; they are the training data the due diligence promises. The live archive on YouTube can be deleted after the house is sold if storage or privacy says so.

## 4. Config the pages read

`src/config.ts` carries nothing about cameras any more. The only camera-related data on the site is `timelapses.json`. The live links live in the WhatsApp groups and in the investor memo, never in the repo.
