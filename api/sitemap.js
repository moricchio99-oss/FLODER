// FileSilver — Sitemap dinamica generata da Supabase.
// Legge tutti i documenti del database (template caricati dagli utenti + seed
// iniziali) e genera l'XML.

module.exports = async function handler(req, res) {
  const SUPABASE_URL = 'https://anfqwtiugwknlcidbdzh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_e7q72bBIfa98OJEOssnB7g_3MbAsBp3';
  const SITE = 'https://filesilver.com';

  const today = new Date().toISOString().split('T')[0];
  const homeBlock = `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  let errorInfo = '';
  let docBlocks = [];

  try {
    const url = `${SUPABASE_URL}/rest/v1/documents?select=id,created_at&order=created_at.desc&limit=10000`;
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error('HTTP ' + r.status + ': ' + txt.slice(0, 200));
    }
    const docs = await r.json();
    if (!Array.isArray(docs)) {
      throw new Error('not array: ' + JSON.stringify(docs).slice(0, 200));
    }
    docBlocks = docs.map(function(d) {
      const ts = d.created_at || new Date().toISOString();
      const lastmod = String(ts).split('T')[0];
      return `  <url>
    <loc>${SITE}/d/${d.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  } catch (e) {
    const msg = String((e && e.message) || e).replace(/--/g, '- -').slice(0, 500);
    errorInfo = '<!-- debug: ' + msg + ' -->';
  }

  const allUrls = [homeBlock].concat(docBlocks).join('\n');
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    (errorInfo ? errorInfo + '\n' : '') +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    allUrls + '\n' +
    '</urlset>';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
