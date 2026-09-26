# HotelBook (frontend)

Next.js frontend for HotelBook — a hotel booking platform I built and own.

API: [hotel-backend](https://github.com/zwecodes/hotel-backend) · Live: [hotelbook-app.vercel.app](https://hotelbook-app.vercel.app)

---

## Stack

- Next.js 15 (App Router), React 19, Tailwind CSS
- Axios with `withCredentials` (HttpOnly cookie sessions)
- Cloudinary for image uploads
- **Stripe Checkout** redirect (no card data on this app)

---

## Payments (Phase 2)

- “Pay online” creates a booking, then `POST /api/payments/checkout` and redirects to Stripe
- Booking becomes `paid` only after Stripe’s signed webhook hits the API
- “Pay at hotel” still confirms without a card charge
- My Bookings “Pay Now” uses the same Checkout flow

Sandbox card: `4242 4242 4242 4242`

---

## Auth (Phase 1)

- HttpOnly cookies on the API; frontend only sets `hb_session=1` for route guards
- Middleware checks session presence — does **not** decode JWT roles
- Password minimum: **10 characters**
- Forgot / reset under `/auth/forgot-password` and `/auth/reset-password`

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

Also run the backend with Stripe test keys + `stripe listen` for webhooks. Apply backend migrations `001` and `002`.

---

## License

Personal project.
