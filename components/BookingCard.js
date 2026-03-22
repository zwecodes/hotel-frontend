"use client";

import { useState, useEffect } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const STATUS_STYLES = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const PAYMENT_STYLES = {
  paid:   "bg-green-50 text-green-700 border-green-200",
  unpaid: "bg-orange-50 text-orange-600 border-orange-200",
};

// ── Live countdown hook ───────────────────────────────────
function useCountdown(targetDate, onExpire) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        onExpire?.();
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours   = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft({ hours, minutes, seconds, totalSeconds });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  return timeLeft;
}

// ── Countdown display ─────────────────────────────────────
function CountdownBadge({ checkInDate, onExpire }) {
  const timeLeft = useCountdown(checkInDate, onExpire);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.totalSeconds < 86400; // under 24 hrs
  const isCritical = timeLeft.totalSeconds < 3600; // under 1 hr

  if (!isUrgent) return null; // only show within 24hrs

  return (
    <div className={`mb-4 rounded-xl px-4 py-3 border flex items-start gap-3 ${
      isCritical
        ? "bg-red-50 border-red-200"
        : "bg-orange-50 border-orange-200"
    }`}>
      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCritical ? "text-red-500" : "text-orange-500"}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${isCritical ? "text-red-700" : "text-orange-700"}`}>
          {isCritical ? "⚠️ Pay immediately!" : "Payment deadline approaching!"}
        </p>
        <p className={`text-xs mt-0.5 ${isCritical ? "text-red-500" : "text-orange-500"}`}>
          Booking expires in{" "}
          <span className="font-mono font-bold text-sm">
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          {" "}— pay now or this booking will be auto-cancelled.
        </p>
      </div>
    </div>
  );
}

// ── Main BookingCard ──────────────────────────────────────
export default function BookingCard({ booking, onCancel, onPay, cancelling, paying, onExpired }) {
  const {
    id, hotel_name, hotel_address, rooms,
    check_in_date, check_out_date, number_of_guests,
    total_price, status, payment_status, created_at,
  } = booking;

  const checkInTime = new Date(check_in_date).getTime();
  const now = Date.now();
  const hoursUntilCheckIn = (checkInTime - now) / (1000 * 60 * 60);

  const canCancel =
    status !== "cancelled" &&
    payment_status === "unpaid" &&
    hoursUntilCheckIn > 24;

  const canPay = payment_status === "unpaid" && status !== "cancelled";

  const showTimer =
    payment_status === "unpaid" &&
    status !== "cancelled" &&
    hoursUntilCheckIn <= 24 &&
    hoursUntilCheckIn > 0;

  const isCritical = hoursUntilCheckIn < 1;

  const nights = Math.max(
    1,
    Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Status color bar */}
      <div className={`h-1 w-full ${
        status === "confirmed" ? "bg-green-400" :
        status === "cancelled" ? "bg-red-400" : "bg-yellow-400"
      }`} />

      <div className="p-5">
        {/* Live countdown timer */}
        {showTimer && (
          <CountdownBadge checkInDate={check_in_date} onExpire={onExpired} />
        )}

        {/* No cancellation notice for paid bookings */}
        {payment_status === "paid" && status !== "cancelled" && (
          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-blue-700">
              This booking is <strong>paid and confirmed</strong>. No cancellations or refunds are available per our policy.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{hotel_name}</h3>
            {hotel_address && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {hotel_address}
              </p>
            )}
            <p className="text-xs text-gray-300 mt-1">Booking #{id} · Booked {formatDate(created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
              {status}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${PAYMENT_STYLES[payment_status] || PAYMENT_STYLES.unpaid}`}>
              {payment_status}
            </span>
          </div>
        </div>

        {/* Dates & guests */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3 mb-4 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
            <p className="text-xs font-semibold text-gray-700">{formatDate(check_in_date)}</p>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
            <p className="text-xs font-semibold text-gray-700">{formatDate(check_out_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Guests</p>
            <p className="text-xs font-semibold text-gray-700">
              {number_of_guests} guest{number_of_guests !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Rooms */}
        {rooms?.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {rooms.map((room, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  <span>{room.room_type} × {room.quantity}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  ${Number(room.price_per_night).toLocaleString()}/night
                  {nights > 1 && (
                    <span className="text-gray-400"> × {nights}n = ${Number(room.total_price).toLocaleString()}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Total ({nights} night{nights > 1 ? "s" : ""})</p>
            <p className="text-lg font-bold text-[#1a56db]">${Number(total_price).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <button onClick={() => onCancel(id)} disabled={cancelling}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
            {canPay && (
              <button onClick={() => onPay(id)} disabled={paying}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5 ${
                  isCritical ? "bg-red-500 hover:bg-red-600" : 
                  showTimer ? "bg-orange-500 hover:bg-orange-600" :
                  "bg-[#1a56db] hover:bg-[#1e429f]"
                }`}>
                {paying ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Processing...</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  {isCritical ? "Pay Now — Urgent!" : showTimer ? "Pay Now — Expiring!" : "Pay Now"}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}