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

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```
