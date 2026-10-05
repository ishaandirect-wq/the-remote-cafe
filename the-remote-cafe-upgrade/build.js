import fs from 'node:fs';
import path from 'node:path';

const BASE_ID = 'appymxbanp8tUDZdY';
const TABLE_NAME = 'Data Table';
const SITE_URL = (process.env.SITE_URL || 'https://the-remote-cafe-ind.vercel.app').replace(/\/$/,'');
const DIST = path.join(process.cwd(),'dist');

function esc(s=''){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function slugify(value=''){return String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
function fmt(v){return (!v || v==='Unconfirmed') ? 'Not yet confirmed' : esc(v);}

async function fetchRecords(){
  const token=process.env.AIRTABLE_TOKEN;
  if(!token) throw new Error('Missing AIRTABLE_TOKEN. Add it in Vercel Project Settings → Environment Variables.');
  let records=[],offset;
  do{
    const url=new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`);
    url.searchParams.set('pageSize','100'); if(offset)url.searchParams.set('offset',offset);
    const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
    if(!r.ok)throw new Error(`Airtable returned ${r.status}`);
    const d=await r.json();records.push(...d.records);offset=d.offset;
  }while(offset);
  return records.filter(r=>r.fields?.status==='Live'&&r.fields?.name).map(r=>({...r,slug:slugify(`${r.fields.name}-${r.fields.neighborhood||r.fields.city||''}`)}));
}

function shell({title,description,canonical,body,schema=''}){
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><link rel="icon" href="/assets/favicon.png"><style>body{margin:0;background:#EBE3DD;color:#16201C;font:16px/1.6 Inter,Arial,sans-serif}main{max-width:920px;margin:auto;padding:36px 20px 72px}a{color:#043B26}.logo{width:220px;max-width:70vw}.crumbs{font-size:13px;margin:24px 0}.hero{margin:26px 0 30px}h1,h2{font-family:Arial,sans-serif;color:#043B26;line-height:1.15}.badge{display:inline-block;background:#C99A3C;color:white;border-radius:99px;padding:4px 9px;font-size:11px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.cell,.card{background:#fff;border:1px solid rgba(4,59,38,.13);border-radius:12px;padding:14px}.cards{display:grid;gap:12px}.muted{color:#66736d;font-size:14px}.take{background:#f7eedb;border-left:3px solid #C99A3C;padding:14px;border-radius:8px}.back{display:inline-block;margin-top:30px}</style>${schema?`<script type="application/ld+json">${schema}</script>`:''}</head><body><main><a href="/"><img class="logo" src="/assets/logo.png" alt="The Remote Cafe"></a>${body}</main></body></html>`;}

const records=await fetchRecords();
fs.rmSync(DIST,{recursive:true,force:true});fs.mkdirSync(path.join(DIST,'assets'),{recursive:true});
fs.copyFileSync('assets/logo.png',path.join(DIST,'assets/logo.png'));fs.copyFileSync('assets/favicon.png',path.join(DIST,'assets/favicon.png'));
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
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'CafeOrCoffeeShop',name:f.name,url:canonical,address:{'@type':'PostalAddress',streetAddress:f.address||'',addressLocality:f.neighborhood||f.city||'',addressRegion:'Maharashtra',addressCountry:'IN'}}).replace(/</g,'\\u003c');
  const body=`<div class="crumbs"><a href="/">Directory</a> / ${f.city?`<a href="/${slugify(f.city)}/">${esc(f.city)}</a> / `:''}${esc(f.neighborhood||'Cafe')}</div><div class="hero"><h1>${esc(f.name)}</h1><div class="muted">${esc([f.neighborhood,f.city].filter(Boolean).join(', '))}</div>${f.editor_verified?'<p><span class="badge">Editor Verified</span></p>':''}</div>${f.editor_review?`<section><h2>Editor's Take</h2><div class="take">${esc(f.editor_review)}</div></section>`:''}<section><h2>Work-from details</h2><div class="grid"><div class="cell"><b>WiFi</b><br>${fmt(f.wifi_status)}</div><div class="cell"><b>Outlets</b><br>${fmt(f.outlet_count)}</div><div class="cell"><b>Noise</b><br>${fmt(f.noise_level)}</div><div class="cell"><b>Sit for</b><br>${fmt(f.seating_duration)}</div><div class="cell"><b>Laptop-friendly</b><br>${fmt(f.laptop_friendly_staff)}</div><div class="cell"><b>Price</b><br>${fmt(f.price_tier)}</div></div></section>${f.address?`<section><h2>Address</h2><p>${esc(f.address)}</p></section>`:''}<p class="muted">Details can change. Editor Verified is an earned TRC signal; unconfirmed fields are shown as such.</p><a class="back" href="/">← Back to the directory</a>`;
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
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`;
fs.writeFileSync(path.join(DIST,'sitemap.xml'),sitemap);fs.writeFileSync(path.join(DIST,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${records.length} cafes, ${urls.length} crawlable URLs.`);
