import { NextResponse } from "next/server";
import { Resend } from "resend";

type ContactPayload = {
  name?: unknown;
  business?: unknown;
  contact?: unknown;
  need?: unknown;
};

const clean = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

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

    if (!apiKey || !from || !to) {
      console.error("Missing Resend environment variables.");
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const payload = (await request.json()) as ContactPayload;
    const name = clean(payload.name, 120);
    const business = clean(payload.business, 180);
    const contact = clean(payload.contact, 180);
    const need = clean(payload.need, 200);

    if (!name || !business || !contact || !need) {
      return NextResponse.json({ error: "Please complete every field." }, { status: 400 });
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
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
