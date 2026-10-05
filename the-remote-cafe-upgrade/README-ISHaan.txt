THE REMOTE CAFE - DEPLOYMENT NOTES

Files in this folder replace the current single index.html setup.

IMPORTANT: before deploying, add AIRTABLE_TOKEN in Vercel as an Environment Variable.
Optional: add SITE_URL. If omitted, the current Vercel URL is used.

The site now:
- builds crawlable cafe, city and neighbourhood pages from Airtable
- keeps a build-time data snapshot for fast loading and fallback
- refreshes live data through /api/cafes without exposing the Airtable token
- keeps Editor Verified and Editor's Take independent
- uses OpenFreeMap for the interactive map
