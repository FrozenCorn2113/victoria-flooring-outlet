import Head from 'next/head';
import Link from 'next/link';
import installers from '@/data/installersData';

export default function TrustedInstallers() {
  const featuredInstallers = installers.filter(i => i.isFeatured);
  const regularInstallers = installers.filter(i => !i.isFeatured);

  return (
    <>
      <Head>
        <title>Trusted Flooring Installers in Victoria BC | Victoria Flooring Outlet</title>
        <meta 
          name="description" 
          content="Find trusted, professional flooring installers in Victoria, BC. Featured installers specializing in LVP, laminate, hardwood, and more. Get quotes and book installation." 
        />
      </Head>

      <div className="min-h-screen bg-vfo-bg">
        {/* Notice Banner - Remove when real data is available */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Installer directory coming soon. Contact information shown below is placeholder data and not yet active.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-white py-12 md:py-16 border-b border-vfo-muted/20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Trusted Flooring Installers
            </h1>
            <p className="text-base md:text-lg text-vfo-bluegrey leading-relaxed max-w-3xl">
              We've partnered with experienced, professional flooring installers throughout 
              Victoria and surrounding areas. All installers are licensed, insured, and 
              specialize in luxury vinyl plank, laminate, and hardwood flooring. No commissions 
              on their labour—you pay them directly for installation services.
            </p>
          </div>
        </section>

        {/* Featured Installers */}
        {featuredInstallers.length > 0 && (
          <section className="py-12 md:py-16">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              <h2 className="text-2xl md:text-3xl font-bold text-vfo-slate mb-8 uppercase tracking-heading">
                Featured Installers
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {featuredInstallers.map((installer) => (
                  <div
                    key={installer.id}
                    className="bg-white border-2 border-vfo-accent rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-vfo-slate">
                        {installer.name}
                      </h3>
                      <span className="px-3 py-1 bg-vfo-accent text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                        Featured
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-vfo-muted mb-1 uppercase tracking-wide">Service Area:</p>
                        <p className="text-sm text-vfo-bluegrey leading-relaxed">{installer.area}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-vfo-muted mb-2 uppercase tracking-wide">Specialties:</p>
                        <ul className="space-y-1">
                          {installer.specialties.map((specialty, idx) => (
                            <li key={idx} className="text-sm text-vfo-bluegrey flex items-start gap-2">
                              <svg className="w-4 h-4 text-vfo-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>{specialty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-vfo-muted/20 flex flex-col gap-3">
                        {installer.phone && (
                          <a 
                            href={`tel:${installer.phone}`}
                            className="text-sm text-vfo-accent hover:text-teal-600 font-medium transition-colors"
                          >
                            📞 {installer.phone}
                          </a>
                        )}
                        {installer.website && (
                          <a
                            href={installer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg text-sm transition-colors text-center uppercase tracking-wide"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regular Installers */}
        {regularInstallers.length > 0 && (
          <section className="py-12 md:py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              <h2 className="text-2xl md:text-3xl font-bold text-vfo-slate mb-8 uppercase tracking-heading">
                All Installers
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {regularInstallers.map((installer) => (
                  <div
                    key={installer.id}
                    className="bg-white border border-vfo-muted/20 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-bold text-vfo-slate mb-4">
                      {installer.name}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-vfo-muted mb-1 uppercase tracking-wide">Service Area:</p>
                        <p className="text-sm text-vfo-bluegrey leading-relaxed">{installer.area}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-vfo-muted mb-2 uppercase tracking-wide">Specialties:</p>
                        <ul className="space-y-1">
                          {installer.specialties.map((specialty, idx) => (
                            <li key={idx} className="text-sm text-vfo-bluegrey flex items-start gap-2">
                              <svg className="w-4 h-4 text-vfo-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>{specialty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-vfo-muted/20 flex flex-col gap-3">
                        {installer.phone && (
                          <a 
                            href={`tel:${installer.phone}`}
                            className="text-sm text-vfo-accent hover:text-teal-600 font-medium transition-colors"
                          >
                            📞 {installer.phone}
                          </a>
                        )}
                        {installer.website && (
                          <a
                            href={installer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg text-sm transition-colors text-center uppercase tracking-wide"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="py-12 md:py-16 bg-vfo-accent/5">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Ready to Install Your New Flooring?
            </h2>
            <p className="text-base text-vfo-bluegrey mb-8 leading-relaxed max-w-2xl mx-auto">
              Shop our weekly flooring deals and connect with one of our trusted installers 
              to get your project started. We don't charge commissions on installation—you work 
              directly with the installer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="inline-block px-8 py-4 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
                Shop Flooring Deals →
              </Link>
              <Link href="/flooring-deals-victoria-bc" className="inline-block px-8 py-4 bg-white hover:bg-vfo-bg text-vfo-slate font-semibold rounded-lg border-2 border-vfo-muted/30 hover:border-vfo-accent transition-all uppercase tracking-wide">
                Learn More →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

