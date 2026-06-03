// FileSilver — Sitemap dinamica generata da Supabase.
// Ogni richiesta a /sitemap.xml passa qui: andiamo a Supabase, prendiamo
// tutti i documenti, e generiamo l'XML con tutti gli URL aggiornati.

export default async function handler(req, res) {
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

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?select=id,updated_at,created_at&order=created_at.desc&limit=10000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!r.ok) throw new Error('supabase ' + r.status);
    const docs = await r.json();

    const docBlocks = docs.map(d => {
      const ts = d.updated_at || d.created_at || new Date().toISOString();
      const lastmod = String(ts).split('T')[0];
      return `  <url>
    <loc>${SITE}/d/${d.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[homeBlock, ...docBlocks].join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (e) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${homeBlock}
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(200).send(xml);
  }
}
