# ArtVault

A personal art gallery app for curating and displaying art, videos, and embeds. Store links, organize into collections, and browse your vault in multiple layouts.

## Features

- **Gallery views** — masonry, grid, list, museum, and portfolio layouts
- **Collections** — nested collections with cover image grids
- **Search** — full-text with fuzzy/typo-tolerant search (pg_trgm)
- **Filters** — by tag, media type, favorites, sort order
- **Favorites & pins** — highlight your best pieces
- **Notes** — add annotations to any art piece
- **Slideshow** — fullscreen auto-advancing presentation mode
- **Mood board** — freeform canvas to arrange pieces spatially
- **Timeline** — chronological view grouped by date
- **Compare** — side-by-side image comparison with zoom & pan
- **Web clipper** — paste any URL to extract media (YouTube, Vimeo, TikTok, Spotify, etc.)
- **Batch operations** — multi-select, bulk delete/move/tag
- **Duplicate detection** — warns when adding an existing URL
- **Broken link checker** — scan all URLs and flag dead links
- **Image proxy** — on-the-fly resize/compress/format conversion
- **Keyboard shortcuts** — `n` new, `/` search, `f` favorites, `s` select, `p` slideshow, `1-5` layouts
- **Dark/light theme** — with system preference detection
- **PWA** — installable as desktop/mobile app, offline image caching
- **Multi-user auth** — signup/login with JWT, user-scoped data
- **Rate limiting** — throttled API with burst and sustained limits
- **Command palette** — quick navigation and actions
- **URL auto-detection** — paste a YouTube/Vimeo/Spotify link, auto-converts to embed

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, React Query |
| Backend | NestJS 11, Prisma 7, PostgreSQL, JWT, Sharp |
| Infra | Docker Compose, Render.com, pnpm workspaces |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 16+

### Local Development

```bash
# Clone
git clone git@github.com:solunkeprithwiraj/ArtVault.git
cd ArtVault

# Install
pnpm install

# Setup database
cp packages/api/.env.example packages/api/.env
# Edit DATABASE_URL if needed

cd packages/api
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts   # optional: seed with demo data
cd ../..

# Setup frontend
cp packages/web/.env.example packages/web/.env.local

# Run both
pnpm dev
```

- Frontend: http://localhost:3001
- API: http://localhost:4001

### Docker Compose

```bash
docker compose up
```

Starts PostgreSQL, API, and web — all wired together.

## Project Structure

```
artvault/
├── packages/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── art-pieces/   # CRUD, search, batch, stats, timeline
│   │   │   ├── collections/  # Nested collections with tree
│   │   │   ├── notes/        # Annotations on art pieces
│   │   │   ├── auth/         # Signup, login, JWT guard
│   │   │   ├── proxy/        # Image proxy with resize/format
│   │   │   ├── scrape/       # URL media extraction
│   │   │   └── prisma/       # Database service
│   │   └── prisma/
│   │       └── schema.prisma # User, ArtPiece, Collection, Note
│   ├── web/                  # Next.js frontend
│   │   └── src/
│   │       ├── app/          # Pages (gallery, add, edit, collections, etc.)
│   │       ├── components/   # UI components
│   │       └── lib/          # API client, hooks, utilities
│   └── shared/               # Shared TypeScript types
├── docker-compose.yml
├── render.yaml               # Render.com deploy config
└── pnpm-workspace.yaml
```

## API Endpoints

### Art Pieces `/api/art-pieces`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (paginated, filterable, sortable, fuzzy search) |
| POST | `/` | Create |
| GET | `/:id` | Get one (with notes) |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |
| PATCH | `/:id/favorite` | Toggle favorite |
| PATCH | `/:id/pin` | Toggle pin |
| GET | `/tags` | All tags with counts |
| GET | `/stats` | Dashboard statistics |
| GET | `/timeline` | Grouped by date |
| GET | `/random` | Random piece |
| GET | `/daily-highlight` | Piece of the day |
| GET | `/discover` | Discovery/recommendations |
| GET | `/check-duplicate?url=` | Duplicate check |
| GET | `/check-links` | Broken link scan |
| GET | `/:id/related` | Related pieces |
| POST | `/batch/delete` | Bulk delete |
| POST | `/batch/move` | Bulk move to collection |
| POST | `/batch/tag` | Bulk add/set tags |
| POST | `/reorder` | Custom sort order |

### Collections `/api/collections`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all |
| GET | `/tree` | Hierarchical tree |
| GET | `/:id` | Get with children and pieces |
| POST | `/` | Create (supports parentId for nesting) |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

### Auth `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Register |
| POST | `/login` | Login |
| POST | `/verify` | Verify token |
| GET | `/me` | Current user |

### Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/proxy?url=&w=&h=&q=&format=` | Image proxy with resize |
| POST | `/api/scrape` | Extract media from URL |
| GET/POST/PUT/DELETE | `/api/art-pieces/:id/notes` | Notes CRUD |

## Environment Variables

### API (`packages/api/.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artvault"
PORT=4001
JWT_SECRET="change-this"
CORS_ORIGIN=http://localhost:3001
```

### Web (`packages/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | New art piece |
| `/` | Focus search |
| `f` | Toggle favorites |
| `s` | Toggle select mode |
| `p` | Start slideshow |
| `1-5` | Switch layout (masonry/grid/list/museum/portfolio) |
| `Esc` | Close lightbox/slideshow |
| `Arrow keys` | Navigate lightbox |
| `Ctrl+K` | Command palette |

## Deploy

### Render.com

The included `render.yaml` configures:
- **Web**: Next.js on free tier
- **API**: NestJS on free tier
- **Database**: Neon PostgreSQL

Push to main and connect the repo on Render.

### Manual

- **Frontend**: Deploy `packages/web` to Vercel (see `vercel.json`)
- **API**: Deploy `packages/api` to Railway (see `railway.json`) or Fly.io (see `fly.toml`)

## License

MIT
