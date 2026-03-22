"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

export default function BookingConfirmPage() {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pendingBooking");
    if (!raw) {
      router.replace("/hotels");
      return;
    }
    try {
      setBooking(JSON.parse(raw));
    } catch {
      router.replace("/hotels");
    }
  }, [router]);

  if (!booking) return null;

  const { hotel, rooms, check_in_date, check_out_date, number_of_guests, nights, total_price } = booking;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/bookings", {
        check_in_date,
        check_out_date,
        number_of_guests,
        rooms: rooms.map((r) => ({ room_id: r.room_id, quantity: r.quantity })),
      });
      if (res.data.success) {
        toast.success("Booking confirmed! 🎉");
        localStorage.removeItem("pendingBooking");
        router.push("/my-bookings");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to hotel
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Confirm Your Booking</h1>
          <p className="text-sm text-gray-500 mt-1">Review your details before confirming</p>
        </div>

        {/* Hotel summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {/* Hotel hero strip */}
          <div className="relative h-32 bg-gray-200">
            <img
              src={`https://picsum.photos/seed/hotel${hotel?.id}hero/800/200`}
              alt={hotel?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            <div className="absolute inset-0 flex items-center px-5">
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">{hotel?.name}</h2>
                <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {hotel?.city}
                </p>
              </div>
            </div>
          </div>

          {/* Stay details */}
          <div className="p-5 grid grid-cols-3 divide-x divide-gray-100 text-center">
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

        {/* Rooms breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1a56db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Room Selection
          </h3>

          <div className="space-y-3">
            {rooms.map((room, idx) => {
              const roomTotal = Number(room.price_per_night) * room.quantity * nights;
              return (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{room.room_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ${Number(room.price_per_night).toLocaleString()} / night × {room.quantity} room{room.quantity > 1 ? "s" : ""} × {nights} night{nights > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm ml-4">
                    ${roomTotal.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Price summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal ({nights} night{nights > 1 ? "s" : ""})</span>
              <span>${Number(total_price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Taxes & fees</span>
              <span className="text-green-600">Included</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-[#1a56db] text-lg">${Number(total_price).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cancellation note */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700">
            Unpaid bookings can be cancelled any time up to 24 hours before check-in. Once paid, no cancellations or refunds are available.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-[#1a56db] text-white font-semibold rounded-xl hover:bg-[#1e429f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm & Book
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}