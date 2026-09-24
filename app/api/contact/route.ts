import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

const allowedNeeds = [
  "A new business website",
  "A redesign of my current website",
  "A landing page",
  "Not sure yet",
] as const;

const contactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please enter your name.")
      .max(80, "Please keep your name under 80 characters."),
    business: z
      .string()
      .trim()
      .min(2, "Please enter your business name.")
      .max(120, "Please keep your business name under 120 characters."),
    contact: z
      .string()
      .trim()
      .min(6, "Enter a valid email address or phone number.")
      .max(120, "Enter a valid email address or phone number.")
      .refine(
        (value) =>
          z.string().email().safeParse(value).success ||
          /^\+?[0-9][0-9\s()-]{5,19}$/.test(value),
        "Enter a valid email address or phone number.",
      ),
    need: z.enum(allowedNeeds, "Please choose what you need."),
    turnstileToken: z
      .string()
      .min(1, "Please complete the security check.")
      .max(2048, "Verification failed. Please refresh and try again."),
    // Honeypot: checked after parsing so bots are not told what caught them.
    website: z.string().max(500).optional(),
  })
  .strict();

const friendlyIssueCodes = new Set(["too_small", "too_big", "custom", "invalid_value"]);

type TurnstileResult = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "deepwebstudios:contact",
    })
  : null;

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL;
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

    if (!apiKey || !from || !to || !turnstileSecret || !ratelimit) {
      console.error("Missing contact-form environment variables.");
      return NextResponse.json({ error: "Contact service is not configured." }, { status: 500 });
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported request." }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 10_000) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const ip =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const limit = await ratelimit.limit(ip);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in a few minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))),
          },
        },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      // Only the messages written in the schema are shown; library defaults are too technical.
      const issue = parsed.error.issues[0];
      const message =
        issue && friendlyIssueCodes.has(issue.code) ? issue.message : "Please check your details.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, business, contact, need, turnstileToken, website } = parsed.data;
    if (website) {
      return NextResponse.json({ success: true });
    }

    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: ip === "unknown" ? undefined : ip,
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    const verification = (await verificationResponse.json()) as TurnstileResult;

    if (!verification.success || verification.action !== "contact") {
      return NextResponse.json(
        { error: "Verification failed. Please refresh and try again." },
        { status: 403 },
      );
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: contact.includes("@") ? contact : undefined,
      subject: `New website inquiry from ${business}`,
      text: [
        "New inquiry received from the DeepWebStudios website.",
        "",
        `Name: ${name}`,
        `Business: ${business}`,
        `Email or WhatsApp: ${contact}`,
        `Project requirement: ${need}`,
      ].join("\n"),
      html: `
        <h2>New DeepWebStudios inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Business:</strong> ${escapeHtml(business)}</p>
        <p><strong>Email or WhatsApp:</strong> ${escapeHtml(contact)}</p>
        <p><strong>Project requirement:</strong> ${escapeHtml(need)}</p>
      `,
    });

    if (error) {
      console.error("Resend delivery failed:", error.message);
      return NextResponse.json({ error: "Unable to send inquiry." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form request failed:", error);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again shortly." },
      { status: 500 },
    );
  }
}
