# 🪙 Coins Frontend

Modern React frontend for the Coins API cryptocurrency trading simulation.

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

The app will run at `http://localhost:5173` (or next available port)

### Production Build

```bash
npm run build
npm run preview
```

## 🔧 Environment Configuration

### Development (Local)
Uses Vite proxy to avoid CORS issues:
- Frontend: `http://localhost:5173`
- API calls: `/api-2/api/...` → proxied to `https://jdwd40.com/api-2/api/...`

### Production (Deployed)
Uses direct API calls:
- API calls: `https://jdwd40.com/api-2/api/...`

### Environment Variables

**`.env.development`** (local dev):
```bash
VITE_API_BASE_URL=/api-2
```

**`.env.production`** (deployed):
```bash
VITE_API_BASE_URL=https://jdwd40.com/api-2
```

## 📁 Project Structure

```
src/
├── features/          # Feature-based modules
│   ├── auth/         # Authentication (login, register, profile)
│   ├── coins/        # Coins list & detail with charts
│   ├── market/       # Market dashboard with trends
│   ├── portfolio/    # User portfolio & holdings
│   └── transactions/ # Transaction history
├── shared/
│   ├── components/   # Reusable UI components
│   ├── layouts/      # App layouts & protected routes
│   └── utils/        # Utility functions (formatters)
├── lib/              # Core libraries (API client, React Query)
└── router.tsx        # Route configuration
```

## 🛠 Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **React Router v6** - Routing
- **TanStack Query v5** - Server state management
- **Zustand** - Client state (auth)
- **Zod** - Runtime validation
- **Tailwind CSS** + **shadcn/ui** - Styling
- **Recharts** - Data visualization
- **React Hook Form** - Form handling

## ✨ Features

- 🔐 **Authentication**: Register, login, JWT token management
- 📊 **Market Dashboard**: Real-time market trends with charts
- 🪙 **Coins**: Browse coins, view details, price history
- 💼 **Portfolio**: Track holdings and P/L
- 🧾 **Transactions**: View transaction history
- 🎨 **Dark Theme**: Beautiful dark mode UI
- ⚡ **Performance**: Prefetching, caching, optimized re-renders

## 🔒 Security

- JWT token storage with expiry checking
- Auto-logout on 401 responses
- Protected routes
- Input validation with Zod

## 📡 API Endpoints

All endpoints use the pattern: `/api-2/api/...`

- **Auth**: `/api/users/register`, `/api/users/login`
- **Coins**: `/api/coins`, `/api/coins/:id`, `/api/coins/:id/history`
- **Market**: `/api/market/price-history`
- **Portfolio**: `/api/portfolio/:userId`
- **Transactions**: `/api/transactions/:userId`

## 🚢 Deployment

### Build

```bash
npm run build
```

### Deploy to VPS

1. Upload `dist/` folder to your VPS
2. Configure nginx/apache to serve the app
3. Set up SPA fallback (all routes → `index.html`)
4. Ensure `.env.production` is used with full API URL

### Nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🐛 Troubleshooting

### CORS Issues in Development

The Vite proxy is configured to handle CORS. If you still see errors:
1. Restart the dev server: `npm run dev`
2. Clear browser cache
3. Check that `.env.development` has `VITE_API_BASE_URL=/api-2`

### Production CORS Issues

If deployed app has CORS issues:
1. Ensure backend allows your domain
2. Check `.env.production` has full URL: `https://jdwd40.com/api-2`
3. Verify nginx/apache CORS headers if using reverse proxy

## 📝 License

MIT
