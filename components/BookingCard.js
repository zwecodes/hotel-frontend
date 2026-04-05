"use client";

import { useState, useEffect } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const STATUS_STYLES = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const PAYMENT_STYLES = {
  paid:         "bg-green-50 text-green-700 border-green-200",
  unpaid:       "bg-orange-50 text-orange-600 border-orange-200",
  pay_at_hotel: "bg-purple-50 text-purple-700 border-purple-200",
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
  const isUrgent   = timeLeft.totalSeconds < 86400;
  const isCritical = timeLeft.totalSeconds < 3600;
  if (!isUrgent) return null;

  return (
    <div className={`mb-4 rounded-xl px-4 py-3 border flex items-start gap-3 ${
      isCritical ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
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

// ── Room Image Lightbox ───────────────────────────────────
function RoomLightbox({ images, startIndex, roomType, onClose }) {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const prev = () => setActiveIndex(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveIndex(i => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <img src={images[activeIndex].image_url} alt={roomType}
        className="max-w-4xl max-h-[78vh] w-full object-contain rounded-lg px-16"
        onClick={e => e.stopPropagation()}/>
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIndex + 1} / {images.length}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-full"
            onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setActiveIndex(i)}
                className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                  i === activeIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                }`}>
                <img src={img.image_url} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Room row with thumbnail ───────────────────────────────
function RoomRow({ room, nights }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasImages = room.images && room.images.length > 0;
  const thumbUrl  = hasImages ? room.images[0].image_url : null;

  return (
    <>
      <div className="flex items-center gap-3">
        {hasImages ? (
          <button onClick={() => setLightboxOpen(true)}
            className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity relative group"
            title="View room photos">
            <img src={thumbUrl} alt={room.room_type} className="w-full h-full object-cover"/>
            {room.images.length > 1 && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
            )}
          </button>
        ) : (
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {room.room_type} × {room.quantity}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            ฿{Number(room.price_per_night).toLocaleString()}/night
            {nights > 1 && (
              <span className="text-gray-300"> × {nights}n = ฿{Number(room.total_price).toLocaleString()}</span>
            )}
          </p>
          {hasImages && room.images.length > 1 && (
            <button onClick={() => setLightboxOpen(true)}
              className="text-xs text-[#1a56db] hover:underline mt-0.5">
              {room.images.length} photos
            </button>
          )}
        </div>
      </div>
      {lightboxOpen && (
        <RoomLightbox
          images={room.images}
          startIndex={0}
          roomType={room.room_type}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// ── Build receipt HTML string ─────────────────────────────
function buildReceiptHTML(booking, nights) {
  const {
    id, hotel_name, hotel_address, rooms,
    check_in_date, check_out_date, number_of_guests,
    total_price, status, payment_status, created_at,
  } = booking;

  const paymentLabel =
    payment_status === "paid" ? "Paid (Credit Card)" :
    payment_status === "pay_at_hotel" ? "Pay at Hotel" :
    "Unpaid — Pay before check-in";

  const statusColor  = status === "confirmed" ? "#15803d" : "#92400e";
  const statusBg     = status === "confirmed" ? "#f0fdf4" : "#fffbeb";
  const statusBorder = status === "confirmed" ? "#86efac" : "#fcd34d";

  const cancellationNote =
    payment_status === "unpaid"
      ? "This booking can be cancelled up to 24 hours before check-in at no charge."
      : payment_status === "pay_at_hotel"
      ? "This booking can be cancelled up to 24 hours before check-in. Payment is due at the hotel on arrival."
      : "This booking is paid and confirmed. No cancellations or refunds are available per our policy.";

  const roomRows = rooms.map(room =>
    `<tr>
      <td style="padding:10px 12px;color:#111;border-bottom:1px solid #f3f4f6;">${room.room_type}</td>
      <td style="padding:10px 12px;text-align:center;color:#111;border-bottom:1px solid #f3f4f6;">${room.quantity}</td>
      <td style="padding:10px 12px;text-align:right;color:#111;border-bottom:1px solid #f3f4f6;">&#3647;${Number(room.price_per_night).toLocaleString()}</td>
      <td style="padding:10px 12px;text-align:right;color:#111;border-bottom:1px solid #f3f4f6;">&#3647;${Number(room.total_price).toLocaleString()}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Booking Receipt #${id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color: #111; }
    @media print { @page { margin: 0.5in; } }
  </style>
</head>
<body>
<div style="max-width:680px;margin:0 auto;padding:40px 32px;">

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #1a56db;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;background:#1a56db;border-radius:8px;display:flex;align-items:center;justify-content:center;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9" fill="#1a56db"/>
        </svg>
      </div>
      <div>
        <div style="font-size:22px;font-weight:bold;color:#1a56db;line-height:1;">HotelBook</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">hotelbook-app.vercel.app</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:18px;font-weight:bold;color:#111;">Booking Confirmation</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Booking #${id}</div>
      <div style="font-size:12px;color:#6b7280;">Issued: ${formatDate(created_at)}</div>
    </div>
  </div>

  <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:8px;padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:8px;">
    <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};flex-shrink:0;"></div>
    <span style="font-size:13px;font-weight:600;color:${statusColor};">
      Booking ${status.charAt(0).toUpperCase() + status.slice(1)} &mdash; ${paymentLabel}
    </span>
  </div>

  <div style="margin-bottom:24px;">
    <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Hotel</div>
    <div style="font-size:18px;font-weight:bold;color:#111;">${hotel_name}</div>
    ${hotel_address ? `<div style="font-size:13px;color:#6b7280;margin-top:2px;">${hotel_address}</div>` : ""}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e5e7eb;">
    <tr>
      <td style="padding:12px 14px;background:#f9fafb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;">Check-in</div>
        <div style="font-size:12px;font-weight:600;color:#111;margin-top:4px;">${formatDateLong(check_in_date)}</div>
      </td>
      <td style="padding:12px 14px;background:#f9fafb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;">Check-out</div>
        <div style="font-size:12px;font-weight:600;color:#111;margin-top:4px;">${formatDateLong(check_out_date)}</div>
      </td>
      <td style="padding:12px 14px;background:#f9fafb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;">Duration</div>
        <div style="font-size:12px;font-weight:600;color:#111;margin-top:4px;">${nights} night${nights > 1 ? "s" : ""}</div>
      </td>
      <td style="padding:12px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;">Guests</div>
        <div style="font-size:12px;font-weight:600;color:#111;margin-top:4px;">${number_of_guests} guest${number_of_guests !== 1 ? "s" : ""}</div>
      </td>
    </tr>
  </table>

  <div style="margin-bottom:24px;">
    <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Room Details</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="text-align:left;padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Room Type</th>
          <th style="text-align:center;padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Qty</th>
          <th style="text-align:right;padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Rate/Night</th>
          <th style="text-align:right;padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${roomRows}</tbody>
    </table>
  </div>

  <div style="border-top:2px solid #1a56db;padding-top:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:12px;color:#6b7280;">Taxes &amp; fees included</div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#6b7280;">Total Amount</div>
      <div style="font-size:24px;font-weight:bold;color:#1a56db;">&#3647;${Number(total_price).toLocaleString()}</div>
    </div>
  </div>

  <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:32px;">
    <div style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:4px;">Cancellation Policy</div>
    <div style="font-size:12px;color:#78350f;">${cancellationNote}</div>
  </div>

  <div style="border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:11px;color:#9ca3af;">Generated by HotelBook &middot; ${new Date().toLocaleString("en-US")}</div>
    <div style="font-size:11px;color:#9ca3af;">Booking #${id}</div>
  </div>

</div>
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`;
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
    (payment_status === "unpaid" || payment_status === "pay_at_hotel") &&
    hoursUntilCheckIn > 24;

  const canPay = payment_status === "unpaid" && status !== "cancelled";

  const showTimer =
    payment_status === "unpaid" &&
    status !== "cancelled" &&
    hoursUntilCheckIn <= 24 &&
    hoursUntilCheckIn > 0;

  const isCritical = hoursUntilCheckIn < 1;

  const canDownloadReceipt =
    status === "confirmed" || payment_status === "pay_at_hotel";

  const nights = Math.max(
    1,
    Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24))
  );

  const handlePrintReceipt = () => {
    const html = buildReceiptHTML(booking, nights);
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      alert("Please allow popups to download the receipt.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Status color bar */}
      <div className={`h-1 w-full ${
        status === "confirmed" ? "bg-green-400" :
        status === "cancelled" ? "bg-red-400" : "bg-yellow-400"
      }`} />

      <div className="p-5">
        {showTimer && (
          <CountdownBadge checkInDate={check_in_date} onExpire={onExpired} />
        )}

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
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PAYMENT_STYLES[payment_status] || PAYMENT_STYLES.unpaid}`}>
              {payment_status === "pay_at_hotel" ? "Pay at Hotel" : payment_status.charAt(0).toUpperCase() + payment_status.slice(1)}
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
          <div className="mb-4 space-y-3">
            {rooms.map((room, i) => (
              <RoomRow key={i} room={room} nights={nights} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Total ({nights} night{nights > 1 ? "s" : ""})</p>
            <p className="text-lg font-bold text-[#1a56db]">฿{Number(total_price).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canDownloadReceipt && (
              <button onClick={handlePrintReceipt}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Receipt
              </button>
            )}

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
                  showTimer  ? "bg-orange-500 hover:bg-orange-600" :
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