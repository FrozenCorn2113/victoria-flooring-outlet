import products from '../products';

function generateSiteMap(allProducts) {
  const currentDate = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage - highest priority -->
  <url>
    <loc>https://victoriaflooringoutlet.ca</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Product pages -->
  ${allProducts
    .map((product) => {
      return `
  <url>
    <loc>https://victoriaflooringoutlet.ca/products/${product.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${product.isWeeklyDeal ? '0.9' : '0.8'}</priority>
  </url>`;
    })
    .join('')}

  <!-- Static pages -->
  <url>
    <loc>https://victoriaflooringoutlet.ca/accessories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://victoriaflooringoutlet.ca/trusted-installers</loc>
    <lastmod>2024-11-17T00:00:00Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://victoriaflooringoutlet.ca/flooring-deals-victoria-bc</loc>
    <lastmod>2024-11-17T00:00:00Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://victoriaflooringoutlet.ca/installing-lvp-in-victoria</loc>
    <lastmod>2024-11-17T00:00:00Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://victoriaflooringoutlet.ca/harbinger-luxury-vinyl-flooring</loc>
    <lastmod>2024-11-17T00:00:00Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://victoriaflooringoutlet.ca/terms</loc>
    <lastmod>2024-11-17T00:00:00Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap(products);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function SiteMap() {
  // This component is never rendered
  return null;
}
