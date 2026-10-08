THE REMOTE CAFE — EDITORIAL REDESIGN

What changed
- Reworked the visual language to feel more like an edited city guide and less like a generic directory.
- New deep-green editorial hero, stronger typography, tighter spacing and less rounded/SaaS-looking UI.
- Curated Picks and neighbourhood discovery have a more intentional magazine-style treatment.
- Cafe cards no longer depend on a photo to look complete. Missing images use numbered TRC editorial tiles.
- Approved image_url photos still display automatically when available.
- Cafe details use a branded TRC cover when no approved image exists.
- "Photos & directions" opens the cafe on Google Maps instead of embedding Google UI inside TRC.
- Google Places UI Kit and the Google browser API key were removed from TRC.
- Editor Verified remains independent from Editor's Take and collections.
- Desktop still keeps list + map together; mobile remains list-first with native search/filter sheets.
- Existing crawlable cafe, city, neighbourhood and collection pages remain.

Photo strategy
TRC no longer pays Google to render cafe photos and does not store Google Places photos.
- image_url present: use the approved TRC-controlled image.
- image_url blank: use the designed TRC fallback.
- visitors who want current venue photos can open Google Maps.

What you need to do
1. Replace the current TRC repo contents with everything in this folder.
2. Keep AIRTABLE_TOKEN in Vercel exactly as it is now.
3. Commit/deploy.

No Google API key or Places UI Kit setup is required for this build.
No Airtable changes are required.

Visual refinement
- Restored the earlier homepage line: “Find somewhere actually good to work from.”
- Sized the full logo to fit the navigation bar and matched the bar to the logo background.
- Removed acronym stamps and repeated category labels from café and discovery tiles.
- Kept the no-photo fallback quiet and information-led.
- Removed the duplicated drawer summary when an Editor's Take is present and made card excerpts end cleanly.
- Kept Editor Verified, Editor's Take and curated collection membership independent.
