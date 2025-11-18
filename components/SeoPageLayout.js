import Link from 'next/link';

const SeoPageLayout = ({ title, children, ctaText = "See this week's deal", ctaHref = "/" }) => {
  return (
    <div className="min-h-screen bg-vfo-bg">
      <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Breadcrumb */}
        <Link href="/">
          <a className="text-sm text-vfo-accent hover:text-teal-600 mb-6 inline-block uppercase tracking-wide">
            ← Back to Weekly Deal
          </a>
        </Link>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading tracking-[0.08em] text-vfo-slate mb-6 uppercase leading-tight">
          {title}
        </h1>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-[15px] font-light text-vfo-bluegrey leading-relaxed space-y-6">
            {children}
          </div>
        </div>

        {/* CTA Box */}
        <div className="mt-12 p-6 md:p-8 bg-vfo-accent/10 border border-vfo-accent/20 rounded-xl">
          <h2 className="text-xl md:text-2xl font-heading tracking-[0.08em] text-vfo-slate mb-3 uppercase">
            Ready to Get Started?
          </h2>
          <p className="text-[15px] font-light text-vfo-bluegrey mb-6 leading-relaxed">
            {ctaText === "See this week's deal" 
              ? "Check out this week's exclusive flooring deal and get started on your project today."
              : ctaText
            }
          </p>
          <Link href={ctaHref}>
            <a className="inline-block px-8 py-4 bg-vfo-accent hover:bg-teal-600 text-white font-medium rounded-lg transition-colors uppercase tracking-wide">
              {ctaText === "See this week's deal" ? "See This Week's Deal →" : ctaText + " →"}
            </a>
          </Link>
        </div>
      </article>
    </div>
  );
};

export default SeoPageLayout;

