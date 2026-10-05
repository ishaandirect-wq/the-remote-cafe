THE REMOTE CAFE — POLISHED PRODUCTION BUILD

Use this folder as the ROOT of your GitHub repository.

Included:
- OpenFreeMap + Leaflet map
- Mobile List-first experience
- Mobile cafe detail bottom sheet
- Private Airtable API through /api/cafes
- Build-time Airtable snapshot for SEO/fallback
- Cafe, city and neighbourhood SEO pages
- sitemap.xml + robots.txt
- External logo/favicon assets
- Resilient build: Airtable failure cannot take the homepage offline
- UI/editorial polish pass

Required Vercel environment variable:
AIRTABLE_TOKEN = your read-only Airtable PAT

The canonical Vercel project is:
the-remote-cafe-ind

Deployment:
1. Upload the CONTENTS of this folder to the root of the GitHub repo.
2. Commit.
3. Vercel should deploy automatically.
4. Check homepage, /api/cafes, /sitemap.xml and /robots.txt.

Do not create a hand-written index.html in the repo. build.js generates dist/index.html during deployment.
