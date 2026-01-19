import Head from 'next/head';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Victoria Flooring Outlet</title>
        <meta
          name="description"
          content="Terms and conditions for purchasing flooring products from Victoria Flooring Outlet. Read our policies on shipping, returns, warranties, and more."
        />
        <link rel="canonical" href="https://victoriaflooringoutlet.ca/terms" />
      </Head>

      <div className="min-h-screen bg-vfo-bg">
        {/* Hero Section */}
        <section className="bg-white py-12 md:py-16 border-b border-vfo-muted/20">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Terms & Conditions
            </h1>
            <p className="text-base text-vfo-bluegrey leading-relaxed">
              Last updated: November 2024
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="prose prose-lg max-w-none">

              {/* Agreement */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Agreement to Terms
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  By accessing and using the Victoria Flooring Outlet website and purchasing our products,
                  you agree to be bound by these Terms and Conditions. If you do not agree with any part
                  of these terms, please do not use our services.
                </p>
              </div>

              {/* Products & Pricing */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Products & Pricing
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  Victoria Flooring Outlet sources premium flooring products from Harbinger Floors and other
                  manufacturers. We strive to provide accurate product descriptions, images, and specifications.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>All prices are listed in Canadian dollars (CAD) and include applicable taxes unless otherwise stated.</li>
                  <li>Prices are subject to change without notice.</li>
                  <li>Product availability varies weekly as we source new deals.</li>
                  <li>Colour representation may vary due to monitor settings; samples are available upon request.</li>
                  <li>We recommend ordering 10% extra material to account for cuts, waste, and future repairs.</li>
                </ul>
              </div>

              {/* Orders & Payment */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Orders & Payment
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  All orders are subject to acceptance and availability. We reserve the right to refuse or
                  cancel any order for any reason, including but not limited to product availability, errors
                  in pricing or product information, or suspected fraud.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>Payment is processed securely through Stripe at the time of purchase.</li>
                  <li>Orders are not confirmed until payment has been successfully processed.</li>
                  <li>You will receive an email confirmation once your order is placed.</li>
                </ul>
              </div>

              {/* Shipping & Delivery */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Shipping & Delivery
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  We ship flooring products throughout British Columbia, with a focus on Victoria and
                  Vancouver Island.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>Shipping costs are calculated based on delivery zone and order weight.</li>
                  <li>Delivery times vary by location and product availability.</li>
                  <li>Flooring products are heavy; please ensure you have assistance available for unloading.</li>
                  <li>Inspect all packages upon delivery and note any visible damage with the carrier.</li>
                  <li>Risk of loss passes to you upon delivery.</li>
                </ul>
              </div>

              {/* Returns & Refunds */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Returns & Refunds
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  Due to the nature of flooring products and our weekly deal model, returns are limited.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>Unopened, undamaged products may be returned within 14 days of delivery for a refund, minus a 15% restocking fee.</li>
                  <li>Opened or installed products cannot be returned.</li>
                  <li>Defective products will be replaced or refunded; please contact us within 48 hours of delivery.</li>
                  <li>Return shipping costs are the responsibility of the buyer unless the product is defective.</li>
                  <li>Custom or special orders are non-refundable.</li>
                </ul>
                <p className="text-vfo-bluegrey leading-relaxed">
                  To initiate a return, please contact us at{' '}
                  <a href="mailto:hello@victoriaflooringoutlet.ca" className="text-vfo-accent hover:text-teal-600">
                    hello@victoriaflooringoutlet.ca
                  </a>
                  .
                </p>
              </div>

              {/* Warranty */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Warranty
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  Harbinger flooring products sold through Victoria Flooring Outlet include Harbinger’s
                  manufacturer warranty, which covers defects in material and workmanship under normal
                  use as outlined in Harbinger’s written warranty guidelines.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>Warranty coverage is provided by Harbinger and is subject to their terms and conditions.</li>
                  <li>Warranty does not cover damage from improper installation, misuse, or accidents.</li>
                  <li>Proof of purchase is required for all warranty claims.</li>
                  <li>Commercial installations may have different warranty terms.</li>
                </ul>
                <p className="text-vfo-bluegrey leading-relaxed">
                  Victoria Flooring Outlet does not provide a separate store warranty; we can assist with
                  documentation, but warranty decisions are made by Harbinger.
                </p>
              </div>

              {/* Installation */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Installation Services
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  Victoria Flooring Outlet provides flooring products only. We do not provide installation
                  services directly. However, we maintain a network of trusted, independent flooring installers
                  in the Victoria area.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>Installers listed on our website are independent contractors, not employees of Victoria Flooring Outlet.</li>
                  <li>We do not charge commissions or fees for installer referrals.</li>
                  <li>You contract directly with the installer for installation services.</li>
                  <li>Victoria Flooring Outlet is not responsible for the quality of installation work or any disputes with installers.</li>
                  <li>Improper installation may void the manufacturer's warranty.</li>
                </ul>
              </div>

              {/* Limitation of Liability */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Limitation of Liability
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  To the maximum extent permitted by law, Victoria Flooring Outlet shall not be liable for
                  any indirect, incidental, special, consequential, or punitive damages arising from your
                  use of our products or services.
                </p>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  Our total liability for any claim arising from a purchase shall not exceed the amount
                  you paid for the product in question.
                </p>
              </div>

              {/* Intellectual Property */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Intellectual Property
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  All content on this website, including text, images, logos, and graphics, is the property
                  of Victoria Flooring Outlet or its licensors and is protected by copyright and trademark
                  laws. You may not reproduce, distribute, or use any content without our written permission.
                </p>
              </div>

              {/* Privacy */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Privacy
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  We collect and use personal information to process orders, provide customer service, and
                  improve our services. We do not sell your personal information to third parties.
                </p>
                <ul className="list-disc pl-6 text-vfo-bluegrey space-y-2 mb-4">
                  <li>Payment information is processed securely by Stripe and is not stored on our servers.</li>
                  <li>We may send order updates and promotional emails; you can unsubscribe at any time.</li>
                  <li>We use cookies to improve website functionality and user experience.</li>
                </ul>
              </div>

              {/* Governing Law */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Governing Law
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  These Terms and Conditions are governed by the laws of the Province of British Columbia,
                  Canada. Any disputes shall be resolved in the courts of British Columbia.
                </p>
              </div>

              {/* Changes */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Changes to Terms
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  We reserve the right to update these Terms and Conditions at any time. Changes will be
                  posted on this page with an updated revision date. Your continued use of our website
                  constitutes acceptance of any changes.
                </p>
              </div>

              {/* Contact */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                  Contact Us
                </h2>
                <p className="text-vfo-bluegrey leading-relaxed mb-4">
                  If you have any questions about these Terms and Conditions, please contact us at:
                </p>
                <p className="text-vfo-bluegrey leading-relaxed">
                  <strong>Victoria Flooring Outlet</strong><br />
                  Email:{' '}
                  <a href="mailto:hello@victoriaflooringoutlet.ca" className="text-vfo-accent hover:text-teal-600">
                    hello@victoriaflooringoutlet.ca
                  </a>
                </p>
              </div>

            </div>
          </div>
        </section>
      </div>
    </>
  );
}
