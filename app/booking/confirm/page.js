"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

// ── Shared Lightbox ───────────────────────────────────────
function ImageLightbox({ images, initialIndex, onClose }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);

  const prev = useCallback((e) => {
    e?.stopPropagation();
    setActiveIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback((e) => {
    e?.stopPropagation();
    setActiveIndex(i => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
      onClick={onClose}>

      {images.length > 1 && (
        <button onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      )}

      <div className="flex flex-col items-center gap-4 px-16 max-w-5xl w-full"
        onClick={e => e.stopPropagation()}>
        <img
          src={images[activeIndex]?.image_url}
          alt=""
          className="max-h-[78vh] w-full object-contain rounded-xl shadow-2xl"
        />
        {images.length > 1 && (
          <p className="text-white/50 text-xs">{activeIndex + 1} / {images.length}</p>
        )}
        {images.length > 1 && (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button key={img.id ?? i} onClick={() => setActiveIndex(i)}
                className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                  i === activeIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                }`}>
                <img src={img.image_url} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <button onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      )}

      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

// ── Room Image Thumbnail ──────────────────────────────────
function RoomImageThumb({ images, roomType }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex,  setActiveIndex]  = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-20 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    );
  }

  // Sort: primary first
  const sorted = [...images].sort((a, b) => b.is_primary - a.is_primary);

  return (
    <>
      <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
        onClick={() => { setActiveIndex(0); setLightboxOpen(true); }}>
        <img src={sorted[0].image_url} alt={roomType}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
            </svg>
          </div>
        </div>
        {sorted.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded-full leading-none py-0.5">
            +{sorted.length - 1}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={sorted}
          initialIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// ── Mock Payment Modal ────────────────────────────────────
function PaymentModal({ totalPrice, onClose, onPay, onPayAtHotel }) {
  const [tab,        setTab]        = useState("card"); // "card" | "hotel"
  const [processing, setProcessing] = useState(false);
  const [cardName,   setCardName]   = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");

  const formatCardNumber = (val) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val) =>
    val.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");

  const handlePay = async () => {
  setProcessing(true);
  await new Promise(res => setTimeout(res, 1800));
  try {
    if (tab === "hotel") {
      await onPayAtHotel();
    } else {
      await onPay();
    }
  } catch {
    setProcessing(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="bg-[#1a56db] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Complete Payment</h2>
            <p className="text-blue-200 text-xs mt-0.5">Secure checkout</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Total</p>
            <p className="text-white font-bold text-xl">฿{Number(totalPrice).toLocaleString()}</p>
          </div>
        </div>

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-2xl gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#1a56db] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Processing payment...</p>
              <p className="text-sm text-gray-400 mt-1">Please don't close this window</p>
            </div>
          </div>
        )}

        <div className="p-6 relative">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
            <button onClick={() => setTab("card")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              Credit Card
            </button>
            <button onClick={() => setTab("hotel")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "hotel" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Pay at Hotel
            </button>
          </div>

          {/* Credit card form */}
          {tab === "card" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name on Card</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <div className="w-6 h-4 bg-red-500 rounded-sm opacity-80"/>
                    <div className="w-6 h-4 bg-yellow-400 rounded-sm opacity-80 -ml-2"/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Expiry Date</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="•••"
                    maxLength={4}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mt-1">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <p className="text-xs text-green-700">Your payment info is encrypted and secure</p>
              </div>
            </div>
          )}

          {/* Pay at hotel */}
          {tab === "hotel" && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#1a56db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Pay when you arrive</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Your room will be reserved. Pay the full amount at the hotel reception upon check-in.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: "✓", text: "Free cancellation up to 24h before", color: "text-green-600" },
                  { icon: "✓", text: "No payment needed today", color: "text-green-600" },
                  { icon: "✓", text: "Room guaranteed on arrival", color: "text-green-600" },
                  { icon: "✓", text: "Cash or card accepted at hotel", color: "text-green-600" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className={`text-sm font-bold ${item.color}`}>{item.icon}</span>
                    <p className="text-xs text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={processing}
            className="mt-5 w-full py-3 bg-[#1a56db] text-white font-semibold rounded-xl hover:bg-[#1e429f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {tab === "card" ? `Pay ฿${Number(totalPrice).toLocaleString()} Now` : "Confirm Reservation"}
          </button>

          <button onClick={onClose} disabled={processing}
            className="mt-2 w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BookingConfirmPage() {
  const router  = useRouter();
  const [booking,      setBooking]      = useState(null);
  const [reserving,    setReserving]    = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pendingBooking");
    if (!raw) { router.replace("/hotels"); return; }
    try {
      setBooking(JSON.parse(raw));
    } catch {
      router.replace("/hotels");
    }
  }, [router]);

  if (!booking) return null;

  const {
    hotel, rooms, check_in_date, check_out_date,
    number_of_guests, nights, total_price,
  } = booking;

  // Primary hotel image — use first image from hotel.images if available
  const hotelImageUrl =
    hotel?.images?.find(img => img.is_primary)?.image_url ||
    hotel?.images?.[0]?.image_url ||
    `https://picsum.photos/seed/hotel${hotel?.id}/800/300`;

  // ── Reserve only (no payment) ──
  const handleReserve = async () => {
    setReserving(true);
    try {
      const res = await api.post("/api/bookings", {
        check_in_date,
        check_out_date,
        number_of_guests,
        rooms: rooms.map(r => ({ room_id: r.room_id, quantity: r.quantity })),
      });
      if (res.data.success) {
        toast.success("Booking reserved! Pay before check-in.");
        localStorage.removeItem("pendingBooking");
        router.push("/my-bookings");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setReserving(false);
    }
  };

  // ── Reserve + pay immediately ──
  const handlePayNow = async () => {
    try {
      // Step 1 — create booking
      const bookRes = await api.post("/api/bookings", {
        check_in_date,
        check_out_date,
        number_of_guests,
        rooms: rooms.map(r => ({ room_id: r.room_id, quantity: r.quantity })),
      });
      if (!bookRes.data.success) throw new Error(bookRes.data.message);

      // Step 2 — pay immediately
      const payRes = await api.patch(`/api/bookings/${bookRes.data.booking_id}/pay`);
      if (!payRes.data.success) throw new Error(payRes.data.message);

      toast.success("Payment successful! Booking confirmed 🎉");
      localStorage.removeItem("pendingBooking");
      router.push("/my-bookings");
    } catch (err) {
      toast.error(err?.message || err.response?.data?.message || "Payment failed. Please try again.");
      throw err; // let modal handle it
    }
  };


  // ── Pay at hotel ──
  const handlePayAtHotel = async () => {
    try {
      const bookRes = await api.post("/api/bookings", {
        check_in_date,
        check_out_date,
        number_of_guests,
        rooms: rooms.map(r => ({ room_id: r.room_id, quantity: r.quantity })),
      });
      if (!bookRes.data.success) throw new Error(bookRes.data.message);

      const payRes = await api.patch(`/api/bookings/${bookRes.data.booking_id}/pay-at-hotel`);
      if (!payRes.data.success) throw new Error(payRes.data.message);

      toast.success("Booking confirmed! Pay on arrival 🏨");
      localStorage.removeItem("pendingBooking");
      router.push("/my-bookings");
    } catch (err) {
      toast.error(err?.message || "Failed. Please try again.");
      throw err;
    }
  };


  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Blue header bar */}
        <div className="bg-[#1a56db] py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-3 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back to hotel
            </button>
            <h1 className="text-2xl font-bold text-white">Confirm Your Booking</h1>
            <p className="text-blue-200 text-sm mt-1">Review your details before confirming</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Left column (3/5) ── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Hotel card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative h-40">
                  <img src={hotelImageUrl} alt={hotel?.name}
                    className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"/>
                  <div className="absolute inset-0 flex items-end px-5 pb-4">
                    <div>
                      <h2 className="text-white font-bold text-xl leading-tight">{hotel?.name}</h2>
                      <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        {hotel?.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stay details */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 text-center py-4">
                  <div className="px-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-in</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(check_in_date)}</p>
                  </div>
                  <div className="px-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-out</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(check_out_date)}</p>
                  </div>
                  <div className="px-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Guests</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {number_of_guests} guest{number_of_guests !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rooms */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#1a56db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  Room Selection
                </h3>

                <div className="space-y-4">
                  {rooms.map((room, idx) => {
                    const roomTotal = Number(room.price_per_night) * room.quantity * nights;
                    return (
                      <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        {/* Room thumbnail — clickable lightbox */}
                        <RoomImageThumb images={room.images} roomType={room.room_type}/>

                        {/* Room details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{room.room_type}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                ฿{Number(room.price_per_night).toLocaleString()}/night
                                {" "}× {room.quantity} room{room.quantity > 1 ? "s" : ""}
                                {" "}× {nights} night{nights > 1 ? "s" : ""}
                              </p>
                            </div>
                            <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                              ${roomTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cancellation policy */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-amber-700">
                  Unpaid bookings can be cancelled any time up to 24 hours before check-in.
                  Once paid, no cancellations or refunds are available.
                </p>
              </div>
            </div>

            {/* ── Right column (2/5) — sticky price + actions ── */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">

                {/* Price summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Price Summary</h3>

                  <div className="space-y-2 mb-4">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-500 truncate mr-2">
                          {room.room_type} × {room.quantity}
                        </span>
                        <span className="text-gray-800 font-medium flex-shrink-0">
                          ฿{(Number(room.price_per_night) * room.quantity).toLocaleString()}/night
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{nights} night{nights > 1 ? "s" : ""}</span>
                      <span>฿{Number(total_price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Taxes & fees</span>
                      <span className="text-green-600 font-medium">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-2xl text-[#1a56db]">
                        ฿{Number(total_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                  {/* Pay Now */}
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="w-full py-3.5 bg-[#1a56db] text-white font-bold rounded-xl hover:bg-[#1e429f] transition-colors shadow-md text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    Confirm & Pay Now
                  </button>

                  {/* Reserve only */}
                  <button
                    onClick={handleReserve}
                    disabled={reserving}
                    className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {reserving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Reserving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Reserve Now, Pay Later
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    Free cancellation up to 24h before check-in
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Payment modal */}
      {showPayModal && (
        <PaymentModal
          totalPrice={total_price}
          onClose={() => setShowPayModal(false)}
          onPay={handlePayNow}
          onPayAtHotel={handlePayAtHotel}
        />
      )}
    </>
  );
}