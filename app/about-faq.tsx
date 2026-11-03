import Image from "next/image";
import { MumbaiClock } from "./mumbai-clock";

// ---------------------------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------------------------

type Founder = {
  name: string;
  role: string;
  bio: string;
  // Path under /public, e.g. "/founder.jpg". Optional.
  photo?: string;
};

// Fill this in to show a "the person behind the studio" card. While it is null nothing renders,
// so no placeholder text or stock photo ever reaches the live site.
const founder: Founder | null = null;

const principles = [
  ["Custom, never templated", "Every layout, type choice and interaction is shaped around your business, so you never look like your competitor."],
  ["You talk to the builder", "No hand-offs. You work directly with the studio building your site, so feedback stays quick and clear."],
  ["Clear from day one", "Scope, timeline and cost are agreed in writing before work starts. No surprise extras."],
] as const;

export function About() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40" id="about">
      <div className="section-heading">
        <div><p className="eyebrow">About the studio</p><h2>Designed and built<br className="max-sm:hidden" /> in Mumbai.</h2></div>
        <p>DeepWebStudios is an independent web studio in Mumbai, India, working with clients worldwide. We design and build custom websites for businesses that want to look credible and turn visitors into real enquiries.</p>
      </div>

      <div className="about-grid">
        {principles.map(([title, copy], index) => (
          <article className="about-card" key={title}>
            <span aria-hidden="true">0{index + 1}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>

      {founder && (
        <article className="founder-card">
          {founder.photo && <Image alt={founder.name} className="founder-photo" height={160} src={founder.photo} width={160} />}
          <div>
            <p className="eyebrow">The person behind the studio</p>
            <h3>{founder.name}</h3>
            <small>{founder.role}</small>
            <p>{founder.bio}</p>
          </div>
        </article>
      )}

      <ul className="about-facts">
        <li>Based in Mumbai, India</li>
        <li>Clients worldwide</li>
        <li>Quoted in INR or USD</li>
        <li>Next.js, React and Tailwind CSS</li>
        <li><MumbaiClock /></li>
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------------------------

type Faq = { q: string; a: string };

// Policies below were chosen by the studio owner: 50% upfront / 50% at launch, 2 revision rounds,
// 1-2 weeks for a single page and 3-5 for multi-page, 30 days of free bug fixes after launch.
const faqs: Faq[] = [
  {
    q: "Do you work with clients outside India?",
    a: "Yes. We are based in Mumbai and work with clients worldwide. We stay in touch by email or WhatsApp, and every project gets a written quote in USD (or INR for projects in India).",
  },
  {
    q: "What can you build?",
    a: "New business websites, redesigns of your current site, landing pages, and development support for your own team. Not sure which you need? Tell us about your business and we will suggest the simplest option that does the job.",
  },
  {
    q: "How does pricing work?",
    a: "Every project gets its own written quote after a short conversation about scope. It covers custom design, development, testing and launch. Hosting, your domain, paid third-party services and ongoing support are spelled out in writing before any work starts.",
  },
  {
    q: "How do payments work?",
    a: "50% upfront to start the project and 50% at launch. Payment details and methods are confirmed in your written quote.",
  },
  {
    q: "How long does a project take?",
    a: "Typically 1 to 2 weeks for a single-page site and 3 to 5 weeks for a multi-page one. The exact timeline depends on scope and on how quickly feedback comes back, and it is confirmed in your quote.",
  },
  {
    q: "How many revisions do I get?",
    a: "Two rounds of revisions are included. Anything beyond that, or anything outside the agreed scope, is quoted separately so you always know the cost first.",
  },
  {
    q: "What happens after launch?",
    a: "You get 30 days of free bug fixes after launch. New features and content changes are quoted separately, and ongoing support can be quoted if you want it.",
  },
  {
    q: "What do you need from me to get started?",
    a: "Fill in the short form below with what you do, what you need and roughly when. We reply with a written quote. Once the scope is agreed and the first 50% is paid, work begins.",
  },
  {
    q: "Can I see examples of your work?",
    a: "Yes, they are in the Work section above. They are demo projects built to show our approach, so the names, figures and results inside them are illustrative, not client results.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export function Faq() {
  return (
    <section className="faq-section" id="faq">
      <div className="faq-intro">
        <p className="eyebrow">Good to know</p>
        <h2>Questions,<br />answered.</h2>
        <p>The things overseas clients ask us most. Something missing? Ask us directly.</p>
        <a href="mailto:support@deepwebstudios.com">support@deepwebstudios.com <span>↗</span></a>
      </div>
      <div className="faq-list">
        {faqs.map(({ q, a }, index) => (
          <details className="faq-item" key={q} name="faq">
            <summary>
              <span className="faq-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="faq-q">{q}</span>
              <span className="faq-icon" aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      {/* Structured data so search engines can show these answers; it mirrors the visible text exactly. */}
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
    </section>
  );
}
