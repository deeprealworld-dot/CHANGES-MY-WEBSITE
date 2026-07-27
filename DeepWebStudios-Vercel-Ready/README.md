# DeepWebStudios

Vercel-ready Next.js website for DeepWebStudios.

## Deploy on Vercel

1. Extract this ZIP.
2. Upload the extracted folder to GitHub.
3. In Vercel, select **Add New → Project** and import the repository.
4. Keep the detected framework as **Next.js**.
5. Leave the Root Directory and build settings at their defaults.
6. Select **Deploy**.

Vercel will run `npm install` and `npm run build` automatically.

## Add missing demo links

Open `app/page.tsx` and search for `TODO_DEMO_URL`. Replace each empty `url`
value with the deployed demo URL.

## Contact form (Resend)

The inquiry form submits directly to `app/api/contact/route.ts`; it does not open
the visitor's email app. Add these environment variables in Vercel:

```env
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=DeepWebStudios Website <website@send.deepwebstudios.com>
CONTACT_TO_EMAIL=support@deepwebstudios.com
```

Use a verified Resend sender for `RESEND_FROM_EMAIL`. Keep the API key in Vercel
only—never commit it to GitHub.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```
