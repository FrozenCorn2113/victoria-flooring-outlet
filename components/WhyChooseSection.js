// components/WhyChooseSection.js

export function WhyChooseSection() {
  return (
    <section className="py-20 md:py-24 bg-vfo-sand">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-vfo-accent mb-4">
          Why Victoria Flooring Outlet
        </p>
        <h2 className="text-3xl md:text-4xl font-heading text-vfo-charcoal mb-12 leading-tight">
          Beautiful floors, amazing prices.
        </h2>

        <div className="grid md:grid-cols-3 gap-10 md:gap-12">

          <div>
            <h3 className="text-lg font-medium text-vfo-charcoal mb-3">
              One Deal. Deep Savings.
            </h3>
            <p className="text-sm font-light text-vfo-grey leading-relaxed">
              By focusing on one product each week, we negotiate exclusive pricing and pass the savings to you.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-vfo-charcoal mb-3">
              Commercial Quality.
            </h3>
            <p className="text-sm font-light text-vfo-grey leading-relaxed">
              Harbinger floors are engineered for durability—waterproof, scratch-resistant, and backed by a lifetime warranty.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-vfo-charcoal mb-3">
              Local & Trusted.
            </h3>
            <p className="text-sm font-light text-vfo-grey leading-relaxed">
              Based in Victoria, BC. We work with vetted local installers to ensure your project goes smoothly.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
