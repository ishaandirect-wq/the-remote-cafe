const BASE_ID = 'appymxbanp8tUDZdY';
const TABLE_NAME = 'Data Table';

const PUBLIC_FIELDS = [
  'status','name','city','neighborhood','address','lat','long','editor_verified','editor_review',
  'editor_verified_date','tags','wifi_status','outlet_count','noise_level','price_tier',
  'last_confirmed_date','seating_duration','ac','laptop_friendly_staff','hours','google_place_id','website'
];
function publicRecord(r) {
  const fields = {};
  for (const key of PUBLIC_FIELDS) if (Object.prototype.hasOwnProperty.call(r.fields || {}, key)) fields[key] = r.fields[key];
  return { id:r.id, fields };
}

function slugify(value='') {
  return String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
}

async function getAllRecords() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN is not configured');
  let records = [], offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`);
    url.searchParams.set('pageSize','100');
    if (offset) url.searchParams.set('offset',offset);
    const response = await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
    if (!response.ok) throw new Error(`Airtable ${response.status}`);
    const data = await response.json();
    records.push(...data.records);
    offset = data.offset;
  } while(offset);
  return records.filter(r => r.fields?.status === 'Live' && r.fields?.name).map(r => {
    const clean = publicRecord(r);
    return {...clean, slug: slugify(`${clean.fields.name}-${clean.fields.neighborhood || clean.fields.city || ''}`)};
  });
}

export default async function handler(req,res) {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const records = await getAllRecords();
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=3600');
    res.status(200).json({records, updatedAt:new Date().toISOString()});
  } catch (error) {
    console.error(error);
    res.status(500).json({error:'Cafe data is temporarily unavailable'});
  }
}
