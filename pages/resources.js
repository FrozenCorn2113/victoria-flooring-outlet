import Head from 'next/head';

const resourceSections = [
  {
    title: 'Warranty & Returns',
    items: [
      { label: 'Harbinger Warranty Guideline', href: '/resources/harbinger-warranty-guideline.pdf' },
      { label: 'Harbinger Return Policy', href: '/resources/harbinger-return-policy.pdf' },
    ],
  },
  {
    title: 'Installation',
    items: [
      { label: 'Harbinger TQZ Installation Guide with Uzin', href: '/resources/harbinger-tqz-installation-guide-with-uzin.pdf' },
      { label: 'Harbinger Dry Back Installation Guide with Uzin', href: '/resources/harbinger-dry-back-installation-guide-with-uzin.pdf' },
      { label: 'Harbinger Signature Acoustic Click Guide', href: '/resources/harbinger-signature-acoustic-click-guide.pdf' },
      { label: 'Harbinger Rubber Versus Installation & Maintenance', href: '/resources/harbinger-rubber-versus-installation-maintenance.pdf' },
    ],
  },
  {
    title: 'Maintenance',
    items: [
      { label: 'Maintenance Guideline', href: '/resources/maintenance-guideline.pdf' },
    ],
  },
];

export default function Resources() {
  return (
    <>
      <Head>
        <title>Resources | Victoria Flooring Outlet</title>
        <meta
          name="description"
          content="Download Harbinger flooring specs, installation guides, warranty details, and maintenance resources."
        />
        <link rel="canonical" href="https://victoriaflooringoutlet.ca/resources" />
      </Head>

      <div className="min-h-screen bg-vfo-bg">
        <section className="bg-white py-12 md:py-16 border-b border-vfo-muted/20">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Resources
            </h1>
            <p className="text-base text-vfo-bluegrey leading-relaxed">
              Access Harbinger product specifications, installation guides, warranty details, and maintenance resources.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="bg-white border border-vfo-muted/20 rounded-xl p-6 md:p-8 mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                Manufacturer Warranty Notice
              </h2>
              <p className="text-vfo-bluegrey leading-relaxed mb-4">
                Warranty coverage is provided by Harbinger as the manufacturer. Victoria Flooring Outlet
                does not issue a separate store warranty. Coverage, proration, exclusions, and claim
                decisions are governed by Harbinger’s written warranty guidelines.
              </p>
              <p className="text-vfo-bluegrey leading-relaxed">
                We’re happy to help with documentation or proof of purchase, but all warranty terms and
                approvals are determined by Harbinger.
              </p>
            </div>
            <div className="grid gap-10 md:gap-12">
              {resourceSections.map((section) => (
                <div key={section.title} className="bg-white border border-vfo-muted/20 rounded-xl p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="text-vfo-accent hover:text-teal-600 font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
