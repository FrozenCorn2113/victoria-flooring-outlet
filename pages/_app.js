import 'tailwindcss/tailwind.css';
import Head from 'next/head';
import { CartProvider } from '@/hooks/use-shopping-cart';
import { Header, Footer } from '@/components/index';
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>
          Victoria Flooring Outlet - Weekly Flooring Deals in Victoria, BC
        </title>
        <meta
          name="description"
          content="Victoria Flooring Outlet features exclusive weekly deals on premium flooring from Harbinger. Luxury vinyl plank, laminate, and accessories. Free shipping on orders over 500 sq ft."
        />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph meta tags for social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Victoria Flooring Outlet" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:title" content="Victoria Flooring Outlet - Weekly Flooring Deals in Victoria, BC" />
        <meta property="og:description" content="Victoria Flooring Outlet features exclusive weekly deals on premium flooring from Harbinger. Luxury vinyl plank, laminate, and accessories. Free shipping on orders over 500 sq ft." />
        <meta property="og:url" content="https://victoriaflooringoutlet.ca" />
        <meta property="og:image" content="https://victoriaflooringoutlet.ca/images/coastal-oak-room.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Victoria Flooring Outlet - Weekly Flooring Deals in Victoria, BC" />
        <meta name="twitter:description" content="Victoria Flooring Outlet features exclusive weekly deals on premium flooring from Harbinger. Luxury vinyl plank, laminate, and accessories. Free shipping on orders over 500 sq ft." />
        <meta name="twitter:image" content="https://victoriaflooringoutlet.ca/images/coastal-oak-room.jpg" />

        {/* Google Analytics - Add your GA_MEASUREMENT_ID to .env.local */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        <style jsx global>{`
          @font-face {
            font-family: 'Avenir Next';
            src: url('/fonts/avenir-next/avenirnext-regular.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Avenir Next';
            src: url('/fonts/avenir-next/avenirnext-light.woff2') format('woff2');
            font-weight: 300;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Avenir Next';
            src: url('/fonts/avenir-next/avenirnext-medium.woff2') format('woff2');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
      </Head>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      </CartProvider>
      <Toaster />
    </>
  );
}

export default MyApp;
