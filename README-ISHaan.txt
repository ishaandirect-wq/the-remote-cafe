THE REMOTE CAFE — APPROVED UI REDESIGN

What changed
- Homepage is now editorial-first: hero search, Curated Picks, neighbourhood discovery, then the full directory.
- Desktop keeps list + map together. Map-only is available when wanted.
- Mobile is list-first, uses horizontal discovery cards, a bottom-sheet filter, and a bottom-sheet cafe detail view.
- Mobile cafe lists scroll naturally with the page instead of inside a nested scroll box.
- Search, collection cards and neighbourhood cards all feed directly into the directory filters.
- Editor Verified remains separate from editorial collections.
- Non-verified cafes are visually labelled as research-based/editor-scouted rather than looking verified.
- Missing cafe photos never break the layout. image_url is optional and can be populated over time.
- Map failure and Airtable refresh failure both degrade gracefully.
- Existing cafe/city/neighbourhood SEO pages remain, plus crawlable editorial collection pages.

Airtable fields added
- editorial_collections: Full workday / Quiet focus / Good for calls / Open late
- workday_fit: Strong / Situational / Poor / Unverified
- homepage_priority: lower number appears earlier
- image_url: optional approved cafe image

What you need to do
1. Replace the current GitHub repo contents with everything in this folder.
2. Keep AIRTABLE_TOKEN in the Vercel project exactly as it is now.
3. Commit. Vercel should deploy automatically.

No manual Airtable setup is required. The new fields have already been created and seeded.

COST-CONTROLLED CAFE PHOTOS
----------------------------
This version does NOT pull Google photos while people browse the cafe list.
Cards use an approved image_url when one exists; otherwise they use a clean TRC placeholder.
Only when somebody opens a cafe with a google_place_id and no image_url does the site load one Google Places UI Kit media component.
Reopening that same cafe in the same page session reuses the existing component.

The existing restricted Google browser key is already wired into this build, so there is no new Vercel environment variable to add for photos.
If Places UI Kit is not enabled in that Google Cloud project, the site simply keeps the TRC fallback rather than breaking.
See AUTO-PHOTOS.txt and COST-CONTROL-PHOTOS.txt for the implementation and cost model.
