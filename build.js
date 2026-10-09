import fs from 'node:fs';
import path from 'node:path';

const BASE_ID = 'appymxbanp8tUDZdY';
const TABLE_NAME = 'Data Table';
const SITE_URL = (process.env.SITE_URL || 'https://the-remote-cafe-ind.vercel.app').replace(/\/$/,'');
const DIST = path.join(process.cwd(),'dist');

const PUBLIC_FIELDS = [
  'status','name','city','neighborhood','address','lat','long','editor_verified','editor_review',
  'editor_verified_date','tags','wifi_status','outlet_count','noise_level','price_tier',
  'last_confirmed_date','seating_duration','ac','laptop_friendly_staff','hours','google_place_id','website',
  'editorial_collections','workday_fit','homepage_priority','image_url','source','website_type'
];
function publicRecord(r){
  const fields={};
  for(const key of PUBLIC_FIELDS) if(Object.prototype.hasOwnProperty.call(r.fields||{},key)) fields[key]=r.fields[key];
  return {id:r.id,fields};
}

function esc(s=''){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function slugify(value=''){return String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
function fmt(v){return (!v || v==='Unconfirmed') ? 'Not yet confirmed' : esc(v);}

async function fetchRecords(){
  const token=process.env.AIRTABLE_TOKEN;
  if(!token){
    console.warn('AIRTABLE_TOKEN is missing. Building a resilient homepage without the SEO snapshot; /api/cafes can recover once the secret is available.');
    return [];
  }
  try{
    let records=[],offset;
    do{
      const url=new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`);
      url.searchParams.set('pageSize','100'); if(offset)url.searchParams.set('offset',offset);
      const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok)throw new Error(`Airtable returned ${r.status}`);
      const d=await r.json();records.push(...d.records);offset=d.offset;
    }while(offset);
    return records.filter(r=>r.fields?.status==='Live'&&r.fields?.name).map(r=>{const clean=publicRecord(r);return {...clean,slug:slugify(`${clean.fields.name}-${clean.fields.neighborhood||clean.fields.city||''}`)}});
  }catch(err){
    console.warn(`Airtable snapshot skipped: ${err.message}. The deployment will still succeed and the homepage will retry through /api/cafes.`);
    return [];
  }
}

function shell({title,description,canonical,body,schema=''}){
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><link rel="icon" href="/assets/favicon.png"><style>
:root{--green:#043B26;--paper:#F5F0EA;--cream:#FBF8F3;--gold:#C99A3C;--ink:#16201C;--muted:#6E756F;--line:rgba(4,59,38,.13)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.65 Inter,Arial,sans-serif}main{max-width:980px;margin:auto;padding:30px 22px 82px}a{color:var(--green)}.logo{width:auto;height:54px;max-width:68vw;display:block;object-fit:contain}.crumbs{font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin:34px 0 18px;color:#7b827e}.hero{margin:0 0 34px;border-bottom:1px solid var(--line);padding:0 0 28px}h1,h2{font-family:Georgia,'Times New Roman',serif;color:var(--green);line-height:1.02;letter-spacing:-.035em;font-weight:500}h1{font-size:clamp(38px,6vw,62px);margin:0 0 10px}h2{font-size:23px;margin:34px 0 13px}.badge{display:inline-block;background:#DFEAE2;color:var(--green);border-radius:1px;padding:5px 8px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.cell,.card{background:var(--cream);border:1px solid var(--line);border-radius:2px;padding:15px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.muted{color:var(--muted);font-size:12.5px}.take{background:#EEE8DE;border-left:2px solid var(--gold);padding:17px}.back,.action{display:inline-block;margin-top:26px;font-weight:700;text-decoration:none;font-size:12px}.action{background:var(--green);color:white;padding:10px 15px;border-radius:2px;margin-right:8px}.card a{font:500 18px/1.15 Georgia,serif;text-decoration:none}.card a:hover{color:#0B563B}.card .muted{margin-top:5px}@media(max-width:600px){main{padding:22px 16px 58px}.logo{width:auto;height:44px}.cards{grid-template-columns:1fr}h1{font-size:42px}}
</style>${schema?`<script type="application/ld+json">${schema}</script>`:''}</head><body><main><a href="/"><img class="logo" src="/assets/logo-transparent-v2.png" alt="The Remote Cafe"></a>${body}</main></body></html>`;}

const records=await fetchRecords();
fs.rmSync(DIST,{recursive:true,force:true});fs.mkdirSync(path.join(DIST,'assets'),{recursive:true});
for (const file of fs.readdirSync('assets')) { const src=path.join('assets',file), dst=path.join(DIST,'assets',file); if (fs.statSync(src).isFile()) fs.copyFileSync(src,dst); }
let template=fs.readFileSync('index.template.html','utf8');
const safeJson=JSON.stringify(records).replace(/</g,'\\u003c');
template=template.replace('__INITIAL_RECORDS_JSON__',safeJson).replaceAll('__SITE_URL__',SITE_URL);
fs.writeFileSync(path.join(DIST,'index.html'),template);

const urls=[`${SITE_URL}/`];
const cities=new Map();
for(const r of records){
  const f=r.fields, city=f.city||'Mumbai', hood=f.neighborhood||'Other';
  if(!cities.has(city))cities.set(city,new Map()); const hm=cities.get(city); if(!hm.has(hood))hm.set(hood,[]); hm.get(hood).push(r);
  const canonical=`${SITE_URL}/cafe/${r.slug}/`; urls.push(canonical);
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'CafeOrCoffeeShop',name:f.name,url:canonical,address:{'@type':'PostalAddress',streetAddress:f.address||'',addressLocality:f.neighborhood||f.city||'',addressCountry:'IN'}}).replace(/</g,'\\u003c');
  const mapUrl=f.google_place_id?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name||'Cafe')}&query_place_id=${encodeURIComponent(f.google_place_id)}`:(f.address?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.address)}`:'');
  const body=`<div class="crumbs"><a href="/">Directory</a> / ${f.city?`<a href="/${slugify(f.city)}/">${esc(f.city)}</a> / `:''}${esc(f.neighborhood||'Cafe')}</div><div class="hero"><h1>${esc(f.name)}</h1><div class="muted">${esc([f.neighborhood,f.city].filter(Boolean).join(', '))}</div>${f.editor_verified?'<p><span class="badge">Editor Verified</span></p>':''}</div>${f.editor_review?`<section><h2>Editor's Take</h2><div class="take">${esc(f.editor_review)}</div></section>`:''}<section><h2>Work-from details</h2><div class="grid"><div class="cell"><b>WiFi</b><br>${fmt(f.wifi_status)}</div><div class="cell"><b>Outlets</b><br>${fmt(f.outlet_count)}</div><div class="cell"><b>Noise</b><br>${fmt(f.noise_level)}</div><div class="cell"><b>Sit for</b><br>${fmt(f.seating_duration)}</div><div class="cell"><b>Laptop-friendly</b><br>${fmt(f.laptop_friendly_staff)}</div><div class="cell"><b>Price</b><br>${fmt(f.price_tier)}</div></div></section>${f.address?`<section><h2>Address</h2><p>${esc(f.address)}</p></section>`:''}<p class="muted">Details can change. Editor Verified is an earned TRC signal; unconfirmed fields are shown as such.</p>${mapUrl?`<a class="action" href="${esc(mapUrl)}" target="_blank" rel="noopener">Photos & directions</a>`:''}<a class="back" href="/">← Back to the directory</a>`;
  const dir=path.join(DIST,'cafe',r.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),shell({title:`${f.name} — work-friendly cafe | The Remote Cafe`,description:`Remote-work details for ${f.name}${f.neighborhood?` in ${f.neighborhood}`:''}: WiFi, outlets, noise and working conditions.`,canonical,body,schema}));
}
for(const [city,hoods] of cities){
  const citySlug=slugify(city), cityRecords=[...hoods.values()].flat(), canonical=`${SITE_URL}/${citySlug}/`;urls.push(canonical);
  let cards=cityRecords.map(r=>`<div class="card"><a href="/cafe/${r.slug}/"><b>${esc(r.fields.name)}</b></a><div class="muted">${esc(r.fields.neighborhood||city)}</div></div>`).join('');
  let body=`<div class="crumbs"><a href="/">Directory</a> / ${esc(city)}</div><div class="hero"><h1>Remote-work-friendly cafes in ${esc(city)}</h1><p>Curated cafes with practical work-from details. Unconfirmed information is labelled rather than guessed.</p></div><div class="cards">${cards}</div>`;
  let dir=path.join(DIST,citySlug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),shell({title:`Remote-work-friendly cafes in ${city} | The Remote Cafe`,description:`Browse curated cafes to work from in ${city}.`,canonical,body}));
  for(const [hood,recs] of hoods){
    const hoodSlug=slugify(hood), can=`${SITE_URL}/${citySlug}/${hoodSlug}/`;urls.push(can);
    cards=recs.map(r=>`<div class="card"><a href="/cafe/${r.slug}/"><b>${esc(r.fields.name)}</b></a><div class="muted">WiFi: ${fmt(r.fields.wifi_status)} · Noise: ${fmt(r.fields.noise_level)}</div></div>`).join('');
    body=`<div class="crumbs"><a href="/">Directory</a> / <a href="/${citySlug}/">${esc(city)}</a> / ${esc(hood)}</div><div class="hero"><h1>Cafes to work from in ${esc(hood)}</h1><p>TRC's curated directory for ${esc(hood)}, with practical remote-work details where known.</p></div><div class="cards">${cards}</div>`;
    dir=path.join(DIST,citySlug,hoodSlug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),shell({title:`Cafes to work from in ${hood}, ${city} | The Remote Cafe`,description:`Remote-work-friendly cafes in ${hood}, ${city}, with WiFi, outlet and noise details where confirmed.`,canonical:can,body}));
  }
}

const collectionDefs = [
  ['editor-verified','Editor Verified', r => !!r.fields.editor_verified],
  ['full-workday','Full workday', r => Array.isArray(r.fields.editorial_collections) && r.fields.editorial_collections.includes('Full workday')],
  ['quiet-focus','Quiet focus', r => Array.isArray(r.fields.editorial_collections) && r.fields.editorial_collections.includes('Quiet focus')],
  ['good-for-calls','Good for calls', r => Array.isArray(r.fields.editorial_collections) && r.fields.editorial_collections.includes('Good for calls')],
  ['open-late','Open late', r => Array.isArray(r.fields.editorial_collections) && r.fields.editorial_collections.includes('Open late')]
];
for (const [slug,label,test] of collectionDefs) {
  const recs=records.filter(test);
  if(!recs.length) continue;
  const canonical=`${SITE_URL}/collections/${slug}/`; urls.push(canonical);
  const cards=recs.map(r=>`<div class="card"><a href="/cafe/${r.slug}/"><b>${esc(r.fields.name)}</b></a><div class="muted">${esc(r.fields.neighborhood||r.fields.city||'')}</div></div>`).join('');
  const body=`<div class="crumbs"><a href="/">Directory</a> / ${esc(label)}</div><div class="hero"><h1>${esc(label)}</h1><p>A TRC-curated collection. Editor Verified remains a separate trust signal and is shown only where earned.</p></div><div class="cards">${cards}</div><a class="back" href="/">← Back to the directory</a>`;
  const dir=path.join(DIST,'collections',slug); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'index.html'),shell({title:`${label} cafes | The Remote Cafe`,description:`Browse ${label.toLowerCase()} cafes in The Remote Cafe directory.`,canonical,body}));
}

const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`;
fs.writeFileSync(path.join(DIST,'sitemap.xml'),sitemap);fs.writeFileSync(path.join(DIST,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${records.length} cafes, ${urls.length} crawlable URLs.`);
