<p align="center">
  <a href="https://github.com/SamurAIGPT/revideo/stargazers"><img src="https://img.shields.io/github/stars/SamurAIGPT/revideo?style=flat-square" alt="GitHub stars"></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Remotion-4-blue?style=flat-square&logo=remotion" alt="Remotion 4">
</p>

<h1 align="center">Revideo</h1>

<p align="center">
  An AI-assisted workspace for scripting, editing, and previewing short-form videos.
</p>

Revideo is a self-hostable Next.js app for building scene-based videos for TikTok, Instagram Reels, and YouTube Shorts. Write a draft from a prompt, arrange scenes in an editor, preview a Remotion composition, and save projects to PostgreSQL.

## What you can do

- Turn a topic into a short script with scenes, narration, and suggested visuals.
- Edit a project in a multi-track timeline and preview it in the browser.
- Choose portrait, landscape, or square layouts, caption styles, uploaded music, and safe-zone guides.
- Save and reopen projects with a PostgreSQL database managed through Prisma.
- Search YouTube through the YouTube Data API and search TikTok or Instagram through MuAPI.
- Generate remix script drafts from discovered videos.

## Requirements and provider costs

The app runs on your own infrastructure. You need Node.js, npm, and PostgreSQL. Google OAuth is used for sign-in. YouTube search and MuAPI integrations need their own API keys; provider usage, hosting, and database costs may apply.

Script generation uses `OPENAI_API_KEY` for the OpenAI Chat Completions API and falls back to a local heuristic script if the remote request fails. `MUAPIAPP_API_KEY` is used only for social search and remix features. Script generation and successful remix requests each use 5 credits. Credit purchases are not available until a payment checkout is connected.

The editor provides an in-browser Remotion preview. **MP4 export is not implemented yet.** The export dialog reports this limitation and still lets you copy suggested social media text; it does not charge credits or download a sample clip.

Uploaded media is stored in the browser's IndexedDB so it can be restored after a reload on that browser. Project metadata is saved to PostgreSQL, but uploaded file bytes are not synced to other browsers or devices; cloud media storage is not configured.

## How it works

- **App:** Next.js 16 App Router and React 19
- **Editor preview:** Remotion Player 4
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL with Prisma 7
- **Authentication:** NextAuth with Google OAuth
- **Video discovery:** YouTube Data API and MuAPI

## Run locally

### 1. Install

Requirements: Node.js 20.9 or newer, npm, and a PostgreSQL database.

```bash
git clone https://github.com/SamurAIGPT/revideo.git
cd revideo
npm install
cp .env.example .env.local
```

### 2. Configure environment

Fill in the database, authentication, and provider values in `.env.local`:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Set the provider keys you plan to use:

```env
OPENAI_API_KEY="your-openai-api-key"
YOUTUBE_API_KEY="your-youtube-data-api-key"
MUAPIAPP_API_KEY="your-muapi-api-key"
```

`DATABASE_URL` should point to your PostgreSQL connection. Set `DIRECT_URL` to the direct database connection used by Prisma commands. The repository includes a Supabase-oriented example; any compatible PostgreSQL database can be used.

In Google Cloud, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Keep provider secrets server-side and out of commits.

### 3. Set up the database and start

```bash
npx prisma db push
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To make a production build, run:

```bash
npm run build
npm start
```

## API routes

| Route | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/generate-script` | `POST` | Create a scene-based script from a prompt. |
| `/api/projects` | `GET`, `POST`, `DELETE` | List, save, or delete video projects. |
| `/api/projects/[id]` | `GET`, `PUT`, `DELETE` | Read, update, or delete a project by ID. |
| `/api/repurpose/search` | `GET`, `POST` | Search for videos by platform and topic. |
| `/api/repurpose/videos` | `GET`, `POST` | Search and filter video results. |
| `/api/repurpose/remix` | `POST` | Request a remix script through MuAPI. |
| `/api/saved-videos` | `GET`, `POST`, `DELETE` | Manage saved video references. |
| `/api/renders` | `POST` | Save render metadata. This does not render a video file. |

Project, saved-video, credit, remix, script-generation, and live-search APIs require a Google-authenticated session. User records are scoped to the signed-in account. Credit purchases are unavailable until checkout is integrated.

Provider-backed search requests are limited to 20 per user per fixed one-minute window per endpoint. Script generation is limited to 12 requests per window and remix generation to 8; counters are stored in PostgreSQL so the limits apply across server instances.

## Project structure

```text
src/app/          Pages and API routes
src/components/   Editor, player, studio, and authentication UI
src/context/      Editor and authentication state
src/lib/          Database, auth, provider, and media helpers
prisma/           PostgreSQL schema
supabase/         Supabase SQL schema
public/videos/    Sample video clips
```

## Contributing

Issues and pull requests are welcome. For changes to integrations, include the provider and required environment variables in the description.

## License

There is currently no `LICENSE` file in this repository, so no license is declared. Check the repository's license status before reusing or distributing the code.
