import Head from 'next/head';
import Link from 'next/link';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us | Victoria Flooring Outlet</title>
        <meta
          name="description"
          content="Get in touch with Victoria Flooring Outlet. Questions about flooring, orders, or installation? We're here to help. Serving Victoria and all of Vancouver Island."
        />
        <link rel="canonical" href="https://victoriaflooringoutlet.ca/contact" />
      </Head>

      <div className="min-h-screen bg-vfo-bg">
        {/* Hero Section */}
        <section className="bg-white py-12 md:py-16 border-b border-vfo-muted/20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Contact Us
            </h1>
            <p className="text-base md:text-lg text-vfo-bluegrey leading-relaxed max-w-2xl">
              Have questions about flooring, your order, or installation? We're here to help.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Get In Touch */}
              <div>
                <h2 className="text-2xl font-bold text-vfo-slate mb-6 uppercase tracking-heading">
                  Get In Touch
                </h2>
                <div className="space-y-6">
                  <a
                    href="mailto:hello@victoriaflooringoutlet.ca"
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-vfo-muted/20 hover:border-vfo-accent hover:shadow-md transition-all group"
                  >
                    <div className="p-3 bg-vfo-accent/10 rounded-lg group-hover:bg-vfo-accent/20 transition-colors">
                      <EnvelopeIcon className="w-6 h-6 text-vfo-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-vfo-muted mb-1 uppercase tracking-wide">Email</p>
                      <p className="text-vfo-slate font-medium">hello@victoriaflooringoutlet.ca</p>
                      <p className="text-sm text-vfo-bluegrey mt-1">We typically respond within 24 hours</p>
                    </div>
                  </a>

                  <a
                    href="sms:7788717681"
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-vfo-muted/20 hover:border-vfo-accent hover:shadow-md transition-all group"
                  >
                    <div className="p-3 bg-vfo-accent/10 rounded-lg group-hover:bg-vfo-accent/20 transition-colors">
                      <PhoneIcon className="w-6 h-6 text-vfo-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-vfo-muted mb-1 uppercase tracking-wide">Text Ty</p>
                      <p className="text-vfo-slate font-medium">778-871-7681</p>
                      <p className="text-sm text-vfo-bluegrey mt-1">Usually responds within an hour</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-vfo-muted/20">
                    <div className="p-3 bg-vfo-accent/10 rounded-lg">
                      <MapPinIcon className="w-6 h-6 text-vfo-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-vfo-muted mb-1 uppercase tracking-wide">Service Area</p>
                      <p className="text-vfo-slate font-medium">Victoria & Vancouver Island</p>
                      <p className="text-sm text-vfo-bluegrey mt-1">Pickup and delivery available</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-vfo-muted/20">
                    <div className="p-3 bg-vfo-accent/10 rounded-lg">
                      <ClockIcon className="w-6 h-6 text-vfo-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-vfo-muted mb-1 uppercase tracking-wide">Hours</p>
                      <p className="text-vfo-slate font-medium">By Appointment</p>
                      <p className="text-sm text-vfo-bluegrey mt-1">Flexible scheduling for pickups</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Questions */}
              <div>
                <h2 className="text-2xl font-bold text-vfo-slate mb-6 uppercase tracking-heading">
                  How Can We Help?
                </h2>
                <div className="space-y-4">
                  <div className="p-5 bg-white rounded-xl border border-vfo-muted/20">
                    <h3 className="font-semibold text-vfo-slate mb-2">Questions About This Week's Deal?</h3>
                    <p className="text-sm text-vfo-bluegrey mb-3">
                      Need specs, samples, or help calculating how much flooring you need?
                    </p>
                    <Link href="/" className="text-sm text-vfo-accent hover:text-teal-600 font-medium">
                      View Current Deal →
                    </Link>
                  </div>

                  <div className="p-5 bg-white rounded-xl border border-vfo-muted/20">
                    <h3 className="font-semibold text-vfo-slate mb-2">Looking for an Installer?</h3>
                    <p className="text-sm text-vfo-bluegrey mb-3">
                      We've partnered with trusted flooring installers throughout Victoria.
                    </p>
                    <Link href="/trusted-installers" className="text-sm text-vfo-accent hover:text-teal-600 font-medium">
                      Find an Installer →
                    </Link>
                  </div>

                  <div className="p-5 bg-white rounded-xl border border-vfo-muted/20">
                    <h3 className="font-semibold text-vfo-slate mb-2">Need Installation Accessories?</h3>
                    <p className="text-sm text-vfo-bluegrey mb-3">
                      We carry adhesives, underlayment, transitions, and stair nosings.
                    </p>
                    <Link href="/accessories" className="text-sm text-vfo-accent hover:text-teal-600 font-medium">
                      Shop Accessories →
                    </Link>
                  </div>

                  <div className="p-5 bg-white rounded-xl border border-vfo-muted/20">
                    <h3 className="font-semibold text-vfo-slate mb-2">Are You an Installer?</h3>
                    <p className="text-sm text-vfo-bluegrey mb-3">
                      Want to be featured on our trusted installers page? Get in touch.
                    </p>
                    <a
                      href="mailto:hello@victoriaflooringoutlet.ca?subject=Installer%20Listing%20Inquiry"
                      className="text-sm text-vfo-accent hover:text-teal-600 font-medium"
                    >
                      Contact Us →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-vfo-accent/5">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Ready to Get Started?
            </h2>
            <p className="text-base text-vfo-bluegrey mb-8 leading-relaxed max-w-2xl mx-auto">
              Check out this week's flooring deal and get everything you need for your project.
            </p>
            <Link href="/" className="inline-block px-8 py-4 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
              See This Week's Deal →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
