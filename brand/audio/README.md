# Reel audio (optional)

Drop your own licensed music files here (`.mp3`, `.m4a`, `.aac`, or `.wav`) and the
Reel renderer will automatically pick one (deterministically, by post id) and mix it
under the video with a fade-out near the end.

**Why this folder is empty by default:** the automation never fetches or bundles
"trending" audio on its own — using a specific trending/meme track from Instagram's
own library isn't possible through the publishing API anyway (that catalog is only
accessible from the native app's Reels camera), and grabbing arbitrary music off the
internet risks a copyright strike on your account. That's a licensing call only you
can make.

If this folder stays empty, Reels are published silent with kinetic captions — a
legitimate, commonly used style for caption-first educational content.

To add your own track: buy/license it, or use royalty-free sources (Pixabay Music,
YouTube Audio Library, Free Music Archive — check each track's license terms), then
commit the file here.
