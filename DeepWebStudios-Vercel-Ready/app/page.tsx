"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Project = {
  title: string;
  type: string;
  visual: "classes" | "gym" | "clinic" | "restaurant" | "plus" | "studio";
  url: string;
};

const projects: Project[] = [
  {
    title: "Royal Classes",
    type: "Education / Multi-page experience",
    visual: "classes",
    url: "https://royal-classes-demo.vercel.app/", // TODO_DEMO_URL: Add the deployed Royal Classes URL.
  },
  {
    title: "The Fitness Square",
    type: "Gym / Lead generation",
    visual: "gym",
    url: "https://modern-gym-website-design-d6swxjjgk.vercel.app/",
  },
  {
    title: "Mumbai Care Clinic",
    type: "Clinic / Appointment journey",
    visual: "clinic",
    url: "https://doctors-website-demo.vercel.app/", // TODO_DEMO_URL: Add the deployed clinic demo URL.
  },
  {
    title: "Restaurant Demo",
    type: "Restaurant / Reservations and discovery",
    visual: "restaurant",
    url: "https://sagaars-resturant-lilac.vercel.app/", // TODO_DEMO_URL: Add the deployed restaurant demo URL.
  },
  {
    title: "Plus Fitness 24/7 Andheri",
    type: "Fitness / Local branch experience",
    visual: "plus",
    url: "https://plus-fitness-24-7-andheri.vercel.app/", // TODO_DEMO_URL: Add the deployed Plus Fitness URL.
  },
];

const tickerItems = ["Restaurants", "Clinics", "Gyms", "Salons", "Coaching classes", "Consultants"];

const processSteps = [
  ["01", "Brief", "We learn your offer, audience, local competition, and exactly what the website must achieve."],
  ["02", "Build", "Strategy becomes a custom responsive experience, complete with clear actions and polished details."],
  ["03", "Launch", "We test, connect your domain, and hand over a website ready to generate genuine inquiries."],
];

const packages = [
  ["Starter", "For solo professionals", "₹5,999", ["Single-page custom build", "WhatsApp-ready lead flow", "Google Maps integration"]],
  ["Growth", "For growing local businesses", "₹9,999", ["Up to five custom pages", "Lead capture system", "Local SEO foundations", "Content editing setup"]],
  ["Pro", "For ambitious institutions", "₹19,999", ["Custom multi-page system", "Advanced content structure", "Conversion-led user journeys", "Post-launch support"]],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!turnstileToken) {
      setFormMessage("Please complete the security check.");
      setFormStatus("error");
      return;
    }
    setFormStatus("sending");
    setFormMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          business: form.get("business"),
          contact: form.get("contact"),
          need: form.get("need"),
          website: form.get("website"),
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || "Unable to send inquiry.");
      }

      formElement.reset();
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setFormStatus("success");
      setFormMessage("Thank you! Your project brief has been sent.");
    } catch (error) {
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setFormStatus("error");
      setFormMessage(error instanceof Error ? error.message : "We couldn’t send your message. Please try again.");
    }
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="overflow-hidden bg-white text-[#1f2937]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[#0f172a]/10 bg-white/90 px-6 backdrop-blur-xl lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <a className="brand-lockup" href="#top" onClick={closeMenu}>
          <Image alt="" aria-hidden="true" height={34} priority src="/favicon.png" width={34} />
          <span className="anton text-[23px] tracking-[-.04em] text-[#0f172a]">
            DEEPWEBSTUDIOS<span className="text-[#2563eb]">.</span>
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className={`absolute left-0 right-0 top-20 flex flex-col border-b border-[#0f172a]/10 bg-white p-6 transition-all lg:static lg:flex lg:flex-row lg:items-center lg:gap-10 lg:border-0 lg:bg-transparent lg:p-0 ${
            menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100"
          }`}
        >
          {[["Work", "#work"], ["Services", "#services"], ["Process", "#process"], ["Pricing", "#pricing"]].map(([label, href]) => (
            <a className="border-b border-[#0f172a]/10 py-4 text-xs font-black uppercase tracking-[.14em] transition-colors hover:text-[#2563eb] lg:border-0 lg:py-0" href={href} key={label} onClick={closeMenu}>
              {label}
            </a>
          ))}
        </nav>

        <a className="primary-cta hidden justify-self-end lg:inline-flex" href="#contact">Start project <span>↗</span></a>
        <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 bg-[#0f172a] lg:hidden" onClick={() => setMenuOpen((open) => !open)} type="button">
          <span className={`h-0.5 w-5 bg-white transition ${menuOpen ? "translate-y-1 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-white transition ${menuOpen ? "-translate-y-1 -rotate-45" : ""}`} />
        </button>
      </header>

      <section className="hero-grid relative flex min-h-[760px] items-center justify-center px-6 pb-24 pt-44 text-center md:min-h-screen" id="top">
        <div className="hero-glow" />
        <div className="relative z-10 mx-auto max-w-[1250px]">
          <div className="mb-9 inline-flex items-center gap-2.5 rounded-full border border-[#0f172a]/10 bg-white/90 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#64748b]">
            <span className="status-dot h-2 w-2 rounded-full bg-[#14b8a6]" />Available for new projects
          </div>
          <h1 className="anton text-[clamp(58px,8.3vw,124px)] leading-[.89] tracking-[-.025em] text-[#0f172a]">
            We build websites<br />that win <span className="highlight">trust</span>
          </h1>
          <p className="mx-auto mt-11 max-w-3xl text-lg leading-relaxed text-[#64748b] md:text-2xl">
            Distinctive, fast websites for Mumbai businesses that want to look credible,
            stand apart, and turn more visitors into real inquiries.
          </p>
          <div className="mt-11 flex flex-col items-center justify-center gap-7 sm:flex-row">
            <a className="primary-cta hero-cta" href="#contact">Start a project <span>↗</span></a>
            <a className="anton border-b-2 border-[#0f172a] py-2 text-xl text-[#0f172a] transition hover:border-[#2563eb] hover:text-[#2563eb]" href="#work">View our work <span className="font-sans">↓</span></a>
          </div>
        </div>
      </section>

      <div className="ticker overflow-hidden border-y border-white/10 bg-[#0a0f1c] py-7 text-white">
        <div className="ticker-track anton text-3xl opacity-30">
          {[0, 1].map((copy) => (
            <div aria-hidden={copy === 1} className="ticker-group" key={copy}>
              {tickerItems.map((item) => (
                <span className="ticker-item" key={item}>
                  <span>{item}</span><i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="grid lg:grid-cols-2">
        {[
          ["Traditional approach", "The old way", ["Generic templates that look like every competitor", "Slow pages that lose impatient mobile visitors", "Confusing journeys with no clear next action", "Hidden extras after the project begins"], false],
          ["Our standard", "The DeepWeb way", ["A visual system shaped around your business", "Fast, responsive layouts built mobile-first", "Conversion paths designed for calls and inquiries", "A clear scope and transparent starting price"], true],
        ].map(([label, title, items, accent]) => (
          <article className={`min-h-[620px] px-6 py-24 md:p-20 xl:p-28 ${accent ? "border-t-8 border-[#2563eb] bg-[#0f172a] lg:border-l-8 lg:border-t-0" : "bg-[#0a0f1c]"}`} key={String(title)}>
            <p className="eyebrow text-[#14b8a6]">{String(label)}</p>
            <h2 className="anton mt-6 text-[clamp(48px,5vw,76px)] leading-none text-white">{String(title)}</h2>
            <ul className="mt-14 grid gap-7">
              {(items as string[]).map((item) => (
                <li className={`flex items-start gap-4 text-lg leading-relaxed ${accent ? "font-medium text-white" : "text-white/55"}`} key={item}>
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${accent ? "border-[#14b8a6]/30 text-[#14b8a6]" : "border-white/15 text-white/30"}`}>{accent ? "✓" : "×"}</span>{item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="bg-[#f8fafc] px-6 py-28 lg:px-12 lg:py-40" id="work">
        <div className="mx-auto max-w-[1312px]">
          <div className="section-heading">
            <div><p className="eyebrow">Selected work</p><h2>Built to feel like<br />the business.</h2></div>
            <p>Purpose-built demo experiences for the exact kinds of local businesses we help. Responsive, focused, and ready to adapt.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {projects.map(({ title, type, visual, url }, index) => (
              <article className={`project-card overflow-hidden border border-[#0f172a]/10 bg-white ${index === 0 ? "md:col-span-2" : ""}`} key={title}>
                <div className={`project-visual ${visual} ${index === 0 ? "min-h-[460px] md:min-h-[540px]" : "min-h-[400px]"}`}>
                  {visual === "classes" && <><div className="relative z-10 flex items-center justify-between text-xs font-bold tracking-widest"><b className="text-2xl text-[#f5c94c]">ROYAL</b><span>ABOUT&nbsp;&nbsp; COURSES&nbsp;&nbsp; RESULTS</span></div><div className="relative z-10 mt-24"><small>ADMISSIONS OPEN 2026–27</small><strong>RESULTS THAT<br />SPEAK LOUDER.</strong><i>EXPLORE COURSES →</i></div><div className="result-stamp">96%</div></>}
                  {visual === "gym" && <><strong className="anton relative z-10 block text-[clamp(50px,5vw,76px)] leading-[.88]">THE FITNESS<br />SQUARE</strong><div className="gym-ring"><span>24/7</span></div><b className="absolute bottom-11 left-10 text-xs tracking-widest text-[#c6ff00]">START TRAINING ↗</b></>}
                  {visual === "clinic" && <><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0d9488] font-black text-white">MC</div><strong className="anton mt-7 block max-w-md text-[clamp(45px,5vw,72px)] leading-[.92]">CARE THAT STARTS<br />WITH LISTENING.</strong><div className="clinic-steps"><span>01<br /><b>Consult</b></span><span>02<br /><b>Treat</b></span><span>03<br /><b>Follow up</b></span></div></>}
                  {visual === "restaurant" && <><p className="restaurant-kicker">Mumbai dining / 2026</p><strong className="anton relative z-10 block text-[clamp(52px,6vw,86px)] leading-[.86]">GOOD FOOD.<br />BETTER NIGHTS.</strong><div className="restaurant-plate">DINE</div><span className="project-action">Reserve a table ↗</span></>}
                  {visual === "plus" && <><span className="plus-mark">PLUS</span><strong className="anton relative z-10 mt-16 block text-[clamp(52px,6vw,82px)] leading-[.86]">YOUR FITNESS.<br />YOUR WAY.</strong><div className="plus-stripe" /><span className="project-action">Join Andheri ↗</span></>}
                  {visual === "studio" && <><span className="studio-label">Mumbai / Independent web studio</span><strong className="anton relative z-10 mt-16 block text-[clamp(55px,6vw,88px)] leading-[.86]">WEBSITES THAT<br /><em>WIN TRUST.</em></strong><div className="studio-grid-mark">D.</div><span className="project-action">Start a project ↗</span></>}
                </div>
                <div className="flex flex-col gap-3 border-t border-[#0f172a]/10 p-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-3"><span className="rounded-full bg-[#14b8a6] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#0a0f1c]">Demo</span><h3 className="anton text-3xl text-[#0f172a]">{title}</h3></div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-xs text-[#64748b]">{type}</p>
                    {url ? (
                      <a aria-label={`Open ${title} live demo`} className="demo-link" href={url} rel="noreferrer" target="_blank">View live demo ↗</a>
                    ) : (
                      <span className="demo-link pending" title="Add this project's URL in the projects array before deployment">Live link coming soon</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40" id="services">
        <div className="section-heading">
          <div><p className="eyebrow">What you get</p><h2>Everything your<br />business needs.</h2></div>
          <p>More than a collection of pages: a focused digital sales experience built around how local customers decide.</p>
        </div>
        <div className="bento-grid">
          <article className="bento-card design-card">
            <div><span className="micro-label">01 / Custom craft</span><h3>Custom UI/UX design</h3><p>Every layout, type choice, and interaction is shaped around your brand—not pulled from a generic template.</p><div className="mt-7 flex flex-wrap gap-2"><span className="tag">Anton</span><span className="tag">Satoshi</span><span className="tag">#2563EB</span></div></div>
            <div className="browser-mock" aria-hidden="true">
              <div className="browser-bar"><i /><i /><i /><span>deepwebstudios.com</span></div>
              <div className="browser-body"><aside><b>D.</b><i /><i /><i /></aside><div><small>LOCAL BUSINESS / DIGITAL STUDIO</small><strong>STAND OUT<br /><em>ONLINE.</em></strong><span>BUILD IT BETTER →</span><mark>YOUR BRAND ↖</mark></div><section><small>TYPE</small><b>Anton</b><small>COLOUR</small><i>#2563EB</i><small>ALIGN</small><span>≡ ≣ ≡</span></section></div>
            </div>
          </article>
          <article className="bento-card bg-[#0f172a] text-white">
            <span className="micro-label text-white/50">02 / Responsive</span>
            <div className="service-icon service-icon-blue" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24"><rect height="19" rx="2.5" stroke="currentColor" strokeWidth="2" width="12" x="6" y="2.5" /><path d="M9.5 18.5h5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>
            </div>
            <h3 className="!text-white">Mobile-first</h3><p className="!text-white/55">Designed around how local customers browse, compare, and contact businesses from their phones.</p>
          </article>
          <article className="bento-card bg-white">
            <span className="micro-label">03 / Discovery</span>
            <div className="service-icon" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>
            </div>
            <h3>Local SEO</h3><p>Clean structure, useful metadata, and location-ready pages create a strong foundation for discovery.</p>
          </article>
          <article className="bento-card inquiry-card"><div><span className="micro-label">04 / Low-friction leads</span><h3>Inquiry-ready journeys</h3><p>Clear contact paths make it easy for visitors to move from interest to a genuine business conversation.</p></div><div className="message-stack"><div><span>●</span><p><small>NEW INQUIRY</small><b>I&apos;d like to know more.</b></p></div><div><span>↗</span><p><small>QUICK RESPONSE</small><b>Conversation started.</b></p></div></div></article>
        </div>
      </section>

      <section className="grid gap-16 bg-[#f8fafc] px-6 py-28 lg:grid-cols-[.75fr_1.25fr] lg:gap-28 lg:px-12 lg:py-40" id="process">
        <div className="h-fit lg:sticky lg:top-36"><p className="eyebrow">Our methodology</p><h2 className="anton mt-6 text-[clamp(72px,8vw,112px)] leading-[.86] tracking-[-.03em] text-[#0f172a]">How it<br />works.</h2><p className="mt-8 max-w-xs leading-relaxed text-[#64748b]">One clear process. No unnecessary complexity.</p></div>
        <div>{processSteps.map(([number, title, copy]) => <article className="process-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40" id="pricing">
        <div className="section-heading"><div><p className="eyebrow">Investment</p><h2>Flat fees.<br />No surprises.</h2></div><p>Clear starting points. Final pricing is confirmed after your project scope is understood.</p></div>
        <div className="grid border border-[#0f172a]/10 lg:grid-cols-3">
          {packages.map(([name, audience, price, features], index) => (
            <article className={`price-card ${index === 1 ? "featured" : ""}`} key={String(name)}>
              {index === 1 && <span className="recommended">Recommended</span>}
              <h3>{String(name)}</h3><p>{String(audience)}</p><div className="anton mt-10 text-5xl"><small>From</small>{String(price)}</div>
              <ul>{(features as string[]).map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
              <a href="#contact">{index === 1 ? "Start now" : "Get a quote"} <span>↗</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-28 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1312px] text-center"><p className="eyebrow">A better engagement</p><h2 className="anton mt-6 text-[clamp(54px,6vw,88px)] leading-[.92] text-[#0f172a]">Built on clarity,<br />not promises.</h2></div>
        <div className="mx-auto mt-16 grid max-w-[1312px] gap-6 md:grid-cols-3">
          {[["01 / See before you commit", "Demo-first", "Start with a focused direction, so you understand the opportunity before a full build begins."], ["02 / No handoffs", "Direct collaboration", "Work with the studio building your site. Feedback stays clear, fast, and close to the result."], ["03 / Clear from day one", "Defined scope", "Deliverables, timeline, and costs are agreed before work starts—no surprise extras."]].map(([label, title, copy], index) => (
            <article className={`proof-card ${index === 1 ? "bg-[#0f172a] text-white md:translate-y-4" : "bg-white text-[#0f172a]"}`} key={title}><span>{label}</span><h3>{title}</h3><p className={index === 1 ? "text-white/55" : "text-[#64748b]"}>{copy}</p><i>✦</i></article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-words" aria-hidden="true"><span>READY TO BUILD</span><span>READY TO LAUNCH</span></div>
        <div className="relative z-10 mx-auto grid max-w-[1312px] items-center gap-16 lg:grid-cols-[1fr_.8fr] lg:gap-28">
          <div><p className="eyebrow !text-white/70">Start the conversation</p><h2 className="anton mt-6 text-[clamp(60px,7vw,102px)] leading-[.88] tracking-[-.025em] text-white">Let&apos;s build a site<br />worth trusting.</h2><p className="mt-9 max-w-xl text-lg leading-relaxed text-white/90">Tell us about your business and submit the form. Your project brief will be delivered directly to our inbox.</p><a className="mt-6 inline-block border-b border-white/50 pb-1 font-black" href="mailto:support@deepwebstudios.com">support@deepwebstudios.com ↗</a></div>
          <form className="contact-form" onSubmit={sendInquiry}>
            <label><span>Your name</span><input name="name" placeholder="Enter your name" required /></label>
            <label><span>Business name</span><input name="business" placeholder="What do you run?" required /></label>
            <label><span>Email or WhatsApp</span><input name="contact" placeholder="How should we reach you?" required /></label>
            <label><span>What do you need?</span><select defaultValue="A new business website" name="need"><option>A new business website</option><option>A redesign of my current website</option><option>A landing page</option><option>Not sure yet</option></select></label>
            <label className="form-honeypot" aria-hidden="true"><span>Website</span><input autoComplete="off" name="website" tabIndex={-1} /></label>
            <Turnstile
              onError={() => { setTurnstileToken(""); setFormMessage("Security check failed to load. Please refresh."); setFormStatus("error"); }}
              onExpire={() => setTurnstileToken("")}
              onSuccess={(token) => { setTurnstileToken(token); setFormMessage(""); if (formStatus === "error") setFormStatus("idle"); }}
              options={{ action: "contact", appearance: "interaction-only", size: "flexible", theme: "light" }}
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
            />
            <button disabled={formStatus === "sending" || !turnstileToken} type="submit">{formStatus === "sending" ? "Sending…" : "Send project brief"} <span>↗</span></button>
            <p aria-live="polite" className={`form-status ${formStatus}`}>
              {formMessage}
            </p>
          </form>
        </div>
      </section>

      <footer className="bg-[#0a0f1c] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-14 px-6 py-20 md:grid-cols-[2fr_.7fr_.8fr] lg:px-12 lg:py-24">
          <div><a className="anton text-3xl" href="#top">DEEPWEBSTUDIOS<span className="text-[#2563eb]">.</span></a><p className="mt-7 max-w-md text-lg leading-relaxed text-white/40">Distinctive websites for Mumbai&apos;s ambitious local businesses.</p></div>
          <div className="footer-column"><span>Explore</span><a href="#work">Work</a><a href="#services">Services</a><a href="#process">Process</a><a href="#pricing">Pricing</a></div>
          <div className="footer-column"><span>Contact</span><a href="mailto:support@deepwebstudios.com">Email the studio</a><p>Mumbai, India</p></div>
        </div>
        <div className="mx-auto flex max-w-[1440px] justify-between border-t border-white/10 px-6 py-8 text-[9px] font-black uppercase tracking-widest text-white/30 lg:px-12"><span>© {new Date().getFullYear()} DeepWebStudios</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </main>
  );
}
