# HotelBook (frontend)

Next.js frontend for HotelBook — a hotel booking platform I built and own.

API: [hotel-backend](https://github.com/zwecodes/hotel-backend) · Live: [hotelbook-app.vercel.app](https://hotelbook-app.vercel.app)

---

## Stack

- Next.js 15 (App Router), React 19, Tailwind CSS
- Axios with `withCredentials` (HttpOnly cookie sessions)
- Cloudinary for image uploads

---

## Auth (Phase 1)

- Login sets HttpOnly cookies on the API (`access_token`, `refresh_token`)
- Frontend only keeps a presence cookie `hb_session=1` for route guards
- Next middleware checks **session presence only** — it does **not** decode JWT roles
- Admin pages still rely on API `403` + client `isAdmin` from `/api/auth/me`
- Password minimum: **10 characters**
- Forgot / reset password pages under `/auth/forgot-password` and `/auth/reset-password`

---

## Local setup

```bash
git clone https://github.com/zwecodes/hotel-frontend.git
cd hotel-frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

```bash
npm run dev
```

App: `http://localhost:3000`

Run the backend locally as well, and apply `migrations/001_auth_tokens.sql` on the database once.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |

---

## Notes

- Payments are still mock — do not treat Pay Now as real charges
- This is a solo project (not a group deliverable)

---

## License

Personal project.
