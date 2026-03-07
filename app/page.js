import Link from 'next/link';

const features = [
  { icon: '◈', title: 'Monitor Google, Yelp & Facebook', body: 'Paste your review profile URLs. We pull in new reviews from all three platforms automatically and surface them in one place.' },
  { icon: '⬡', title: 'Curate your best testimonials', body: 'Spot a great review? Save it to your testimonial library with one click. Filter by platform, rating, and date.' },
  { icon: '◻', title: 'Generate shareable graphics', body: 'Turn saved testimonials into branded 800×800 social images. Download as PNG — ready for Instagram, Facebook, and your website.' },
];

const platforms = [
  { label: 'Google',   color: '#4285F4', symbol: 'G' },
  { label: 'Yelp',     color: '#d32323', symbol: '★' },
  { label: 'Facebook', color: '#1877F2', symbol: 'f' },
];

const tiers = [
  { name: 'Starter', price: '$9', desc: 'For businesses just getting started', highlight: false,
    features: ['Google review monitoring', 'Review dashboard', 'Up to 10 testimonial saves/mo', 'Testimonial graphic generator'] },
  { name: 'Growth', price: '$19', desc: 'Most popular for active businesses', highlight: true,
    features: ['Google, Yelp & Facebook monitoring', 'Unified review dashboard', 'Unlimited testimonials', 'Testimonial graphic generator', 'Review alerts'] },
  { name: 'Pro', price: '$49', desc: 'For businesses that want done-for-you', highlight: false,
    features: ['Everything in Growth', 'Done-for-you testimonial graphics', 'Custom card creation', 'Marketing assets delivered to you', 'Priority support'] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 h-16"
        style={{ background: 'rgba(250,249,247,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/auth/login" className="btn-ghost">Log in</Link>
          <Link href="/auth/signup" className="btn-primary text-sm px-4 py-2">Get started →</Link>
        </nav>
      </header>

      <section className="pt-44 pb-28 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          {platforms.map((p) => (
            <span key={p.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${p.color}14`, color: p.color }}>
              <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-white font-bold"
                style={{ background: p.color, fontSize: '8px' }}>{p.symbol}</span>
              {p.label}
            </span>
          ))}
        </div>
        <h1 className="mx-auto mb-6 tracking-tight font-semibold leading-[1.08]"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem, 6vw, 4.4rem)', color: 'var(--ink)', maxWidth: '820px' }}>
          Monitor your reviews.<br />
          <em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>Turn them into revenue.</em>
        </h1>
        <p className="text-lg max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
          Track Google, Yelp, and Facebook reviews in one dashboard — then convert your best ones into marketing assets that bring customers in the door.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/auth/signup" className="btn-primary px-7 py-3 text-base">Start free trial →</Link>
          <Link href="/auth/login" className="btn-secondary px-7 py-3 text-base">Sign in</Link>
        </div>
        <p className="mt-10 text-sm" style={{ color: 'var(--ink-muted)' }}>
          <span className="text-amber-400">★★★★★</span>&ensp;Loved by local business owners · No credit card required
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="card p-8">
            <div className="text-2xl mb-4 w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: 'var(--ember-soft)', color: 'var(--ember)' }}>{f.icon}</div>
            <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-40">
        <div className="text-center mb-12">
          <p className="page-eyebrow text-center mb-2">Simple pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Start free. Upgrade when you're ready.
          </h2>
          <p className="text-sm mt-3" style={{ color: 'var(--ink-muted)' }}>14-day free trial. No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier) => (
            <div key={tier.name} className="card p-8 flex flex-col"
              style={tier.highlight ? { border: '2px solid var(--ember)', boxShadow: '0 8px 40px rgba(201,168,76,0.14)' } : {}}>
              {tier.highlight && <div className="badge badge-amber mb-4 self-start">Most popular</div>}
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--ink-muted)' }}>{tier.name}</p>
              <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                {tier.price}<span className="text-base font-normal" style={{ color: 'var(--ink-muted)' }}>/mo</span>
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>{tier.desc}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink)' }}>
                    <span style={{ color: 'var(--ember)', flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className={tier.highlight ? 'btn-primary text-center py-3' : 'btn-secondary text-center py-3'}>
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #b8922a, #F0C040)' }}>R</div>
      <span className="font-semibold text-stone-900" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>Revora.io</span>
    </Link>
  );
}
