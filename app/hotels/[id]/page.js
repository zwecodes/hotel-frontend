"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoomCard from "@/components/RoomCard";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { getHotelImage } from "@/lib/images";

// ── Helpers ───────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function getDefaultDates() {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { today: fmt(today), tomorrow: fmt(tomorrow) };
}

// ── Star Rating ───────────────────────────────────────────
function StarRating({ rating, interactive = false, onRate, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;
  const sz = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i}
          onClick={() => interactive && onRate && onRate(i + 1)}
          onMouseEnter={() => interactive && setHovered(i + 1)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`${sz} ${interactive ? "cursor-pointer" : ""} transition-colors ${i < display ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// ── Amenities ─────────────────────────────────────────────
const AMENITIES = [
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>), label: "Free WiFi" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>), label: "Free Parking" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 10a9 9 0 0118 0M3 10v4a9 9 0 0018 0v-4"/></svg>), label: "Swimming Pool" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>), label: "Fitness Center" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>), label: "24hr Room Service" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.58-1.58a2.25 2.25 0 00-1.591-.659H7.5m12 0L21 17.25"/></svg>), label: "Breakfast Included" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>), label: "Air Conditioning" },
  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>), label: "Non-smoking Rooms" },
];

// ── Hotel Gallery ─────────────────────────────────────────
function HotelGallery({ images, hotelName, hotelId }) {
  const [activeIndex, setActiveIndex]   = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const displayImages = images && images.length > 0
    ? images
    : [{ id: "fallback", image_url: getHotelImage(Number(hotelId)), is_primary: 1 }];

  const activeImage = displayImages[activeIndex];
  const prev = () => setActiveIndex(i => (i - 1 + displayImages.length) % displayImages.length);
  const next = () => setActiveIndex(i => (i + 1) % displayImages.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, displayImages.length]);

  return (
    <>
      <div className="relative h-64 sm:h-80 lg:h-[420px] bg-gray-900 overflow-hidden">
        <img src={activeImage.image_url} alt={hotelName}
          className="w-full h-full object-cover opacity-90 cursor-pointer"
          onClick={() => setLightboxOpen(true)} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {displayImages.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
              {displayImages.map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "bg-white w-5" : "bg-white/50 w-1.5"}`} />
              ))}
            </div>
          </>
        )}

        {displayImages.length > 1 && (
          <button onClick={() => setLightboxOpen(true)}
            className="absolute bottom-20 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            View all {displayImages.length} photos
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{hotelName}</h1>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
          {activeIndex + 1} / {displayImages.length}
        </div>
      </div>

      {displayImages.length > 1 && (
        <div className="bg-gray-900 px-4 py-2.5 flex gap-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex gap-2">
            {displayImages.map((img, i) => (
              <button key={img.id} onClick={() => setActiveIndex(i)}
                className={`flex-shrink-0 w-16 h-11 rounded-md overflow-hidden border-2 transition-all ${i === activeIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"}`}>
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <img src={activeImage.image_url} alt={hotelName}
            className="max-w-5xl max-h-[88vh] w-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()} />
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <button onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}
    </>
  );
}

// ── Review Score Summary ──────────────────────────────────
function ReviewSummary({ averageRating, totalReviews }) {
  if (!totalReviews || totalReviews === 0) return null;
  const pct = (averageRating / 5) * 100;
  const label =
    averageRating >= 4.5 ? "Exceptional" :
    averageRating >= 4.0 ? "Excellent" :
    averageRating >= 3.5 ? "Very Good" :
    averageRating >= 3.0 ? "Good" : "Fair";

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
      <div className="text-center flex-shrink-0">
        <div className="text-4xl font-bold text-[#1a56db]">{Number(averageRating).toFixed(1)}</div>
        <div className="text-xs font-semibold text-[#1a56db] mt-0.5">{label}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <StarRating rating={Math.round(averageRating)} size="sm" />
          <span className="text-sm text-gray-500">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-2">
          <div className="bg-[#1a56db] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function HotelDetailPage() {
  const { id }       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const { today, tomorrow } = getDefaultDates();

  const [checkIn,  setCheckIn]  = useState(searchParams.get("check_in")  || today);
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") || tomorrow);
  const [guests,   setGuests]   = useState(searchParams.get("guests")    || "1");

  const [hotel,      setHotel]      = useState(null);
  const [rooms,      setRooms]      = useState([]);
  const [reviews,    setReviews]    = useState([]);
  const [ratingData, setRatingData] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [loading,    setLoading]    = useState(true);

  const [reviewRating,     setReviewRating]     = useState(5);
  const [reviewComment,    setReviewComment]    = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/hotels/${id}`),
      checkIn && checkOut
        ? api.get(`/api/hotels/${id}/rooms/availability?check_in=${checkIn}&check_out=${checkOut}`)
        : api.get(`/api/hotels/${id}/rooms`),
      api.get(`/api/reviews/hotel/${id}`),
      api.get(`/api/reviews/hotel/${id}/rating`),
    ])
      .then(([hotelRes, roomsRes, reviewsRes, ratingRes]) => {
        if (hotelRes.data.success) setHotel(hotelRes.data.data);
        if (roomsRes.data.success) {
          setRooms(roomsRes.data.data);
          const init = {};
          roomsRes.data.data.forEach(r => { init[r.id] = 0; });
          setQuantities(init);
        }
        if (reviewsRes.data.success) setReviews(reviewsRes.data.data);
        if (ratingRes.data.success)  setRatingData(ratingRes.data.data);
      })
      .catch(() => toast.error("Failed to load hotel details"))
      .finally(() => setLoading(false));
  }, [id, checkIn, checkOut]);

  const nights = Math.max(1,
    checkIn && checkOut
      ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
      : 1
  );

  const selectedRooms = rooms.filter(r => quantities[r.id] > 0);
  const totalPerNight = selectedRooms.reduce((s, r) => s + Number(r.price_per_night) * quantities[r.id], 0);
  const grandTotal    = totalPerNight * nights;

  const handleQuantityChange = (roomId, qty) =>
    setQuantities(prev => ({ ...prev, [roomId]: qty }));

  const handleBookNow = () => {
    if (!isAuthenticated) { router.push(`/auth/login?redirect=/hotels/${id}`); return; }
    if (selectedRooms.length === 0) { toast.error("Please select at least one room"); return; }
    const bookingData = {
      hotel,
      rooms: selectedRooms.map(r => ({
        room_id: r.id, room_type: r.room_type,
        quantity: quantities[r.id], price_per_night: r.price_per_night,
      })),
      check_in_date: checkIn, check_out_date: checkOut,
      number_of_guests: Number(guests), nights, total_price: grandTotal,
    };
    localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
    router.push("/booking/confirm");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) { toast.error("Please write a comment"); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post("/api/reviews", {
        hotel_id: Number(id), rating: reviewRating, comment: reviewComment.trim(),
      });
      if (res.data.success) {
        toast.success("Review submitted!");
        setReviews(prev => [{ id: res.data.review_id, rating: reviewRating, comment: reviewComment.trim(), user_name: "You", created_at: new Date().toISOString() }, ...prev]);
        setRatingData(prev => {
          if (!prev) return { average_rating: reviewRating, total_reviews: 1 };
          const newTotal = Number(prev.total_reviews) + 1;
          const newAvg   = ((Number(prev.average_rating) * Number(prev.total_reviews)) + reviewRating) / newTotal;
          return { average_rating: newAvg, total_reviews: newTotal };
        });
        setReviewComment(""); setReviewRating(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally { setSubmittingReview(false); }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[420px] bg-gray-200 w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">Hotel not found.</p>
        <button onClick={() => router.push("/hotels")} className="mt-4 text-[#1a56db] underline text-sm">
          Back to Hotels
        </button>
      </div>
    );
  }

  // Google Maps URL built from hotel address + city
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.address} ${hotel.city}`)}`;

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* Gallery */}
      <HotelGallery images={hotel.images} hotelName={hotel.name} hotelId={id} />

      {/* Meta bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <svg className="w-4 h-4 text-[#1a56db] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{hotel.address}, {hotel.city}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span className="text-sm text-gray-500 ml-0.5">{hotel.star_rating}-Star Hotel</span>
            </div>
            {hotel.phone_number && (
              <a href={`tel:${hotel.phone_number}`}
                className="flex items-center gap-1.5 text-sm text-[#1a56db] font-medium hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                {hotel.phone_number}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* About + Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this hotel</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {hotel.description || "A wonderful place to stay during your visit."}
              </p>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AMENITIES.map((a) => (
                  <div key={a.label}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <div className="text-[#1a56db]">{a.icon}</div>
                    <span className="text-xs font-medium text-gray-600 leading-tight">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Location</h2>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#1a56db] hover:underline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Open in Google Maps
                </a>
              </div>

              {/* Map placeholder */}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-100 flex flex-col items-center justify-center mb-4 relative overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg,#1a56db,#1a56db 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#1a56db,#1a56db 1px,transparent 1px,transparent 40px)" }} />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-[#1a56db] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#1a56db]">{hotel.name}</p>
                    <p className="text-xs text-blue-400">Click to open in Google Maps</p>
                  </div>
                </div>
              </a>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-[#1a56db] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{hotel.name}</p>
                  <p className="text-sm text-gray-500">{hotel.address}</p>
                  <p className="text-sm text-gray-500">{hotel.city}</p>
                </div>
              </div>
            </div>

            {/* Hotel Policies */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Hotel Policies</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>), title: "Check-in", value: "From 14:00 (2:00 PM)" },
                  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>), title: "Check-out", value: "Until 12:00 (12:00 PM)" },
                  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>), title: "Cancellation", value: "Free cancellation within 24 hours" },
                  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>), title: "Smoking", value: "Non-smoking property" },
                  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>), title: "Pets", value: "Pets not allowed" },
                  { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>), title: "Payment", value: "Credit card & cash accepted" },
                ].map(p => (
                  <div key={p.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="text-[#1a56db] flex-shrink-0 mt-0.5">{p.icon}</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{p.title}</p>
                      <p className="text-sm text-gray-800 mt-0.5">{p.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Available Rooms</h2>
                  {rooms.length > 0 && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {rooms.length} room type{rooms.length !== 1 ? "s" : ""} · sorted by price
                    </p>
                  )}
                </div>
              </div>
              {rooms.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  <p className="text-sm">No rooms available for the selected dates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rooms.map(room => (
                    <RoomCard key={room.id} room={room}
                      quantity={quantities[room.id] || 0}
                      onQuantityChange={qty => handleQuantityChange(room.id, qty)} />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Guest Reviews
                {reviews.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({reviews.length})</span>}
              </h2>

              {ratingData && Number(ratingData.total_reviews) > 0 && (
                <div className="mb-5">
                  <ReviewSummary averageRating={ratingData.average_rating} totalReviews={ratingData.total_reviews} />
                </div>
              )}

              {isAuthenticated && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">Your Rating</label>
                      <StarRating rating={reviewRating} interactive onRate={setReviewRating} size="lg" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Comment</label>
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                        rows={3} placeholder="Share your experience..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] resize-none"/>
                    </div>
                    <button type="submit" disabled={submittingReview}
                      className="px-6 py-2.5 bg-[#1a56db] text-white text-sm font-semibold rounded-xl hover:bg-[#1e429f] disabled:opacity-60 transition-colors">
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 shadow-sm">
                  <p className="text-sm">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1a56db] text-sm font-bold uppercase">{review.user_name?.[0] ?? "?"}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{review.user_name}</p>
                            <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column — sticky booking panel ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">

              {/* Date & Guest picker */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4">Select Your Stay</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Check-in</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <input type="date" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Check-out</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <input type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Guests</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <input type="number" value={guests} min={1} max={20} onChange={e => setGuests(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
                    </div>
                  </div>
                </div>
                {checkIn && checkOut && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                      ✓ {nights} night{nights !== 1 ? "s" : ""} · {formatDate(checkIn)} → {formatDate(checkOut)}
                    </p>
                  </div>
                )}
              </div>

              {/* Price summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Price Summary</h3>
                {selectedRooms.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">Select rooms to see pricing</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRooms.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate mr-2">{r.room_type} × {quantities[r.id]}</span>
                        <span className="text-gray-800 font-medium flex-shrink-0">
                          ฿{(Number(r.price_per_night) * quantities[r.id]).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>฿{totalPerNight.toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-xl text-[#1a56db]">฿{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={handleBookNow}
                  className="mt-4 w-full py-3 bg-[#1a56db] text-white font-semibold rounded-xl hover:bg-[#1e429f] transition-colors shadow-sm text-sm">
                  {isAuthenticated ? "Book Now" : "Login to Book"}
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">Free cancellation within 24 hours</p>
              </div>

              {/* Quick contact */}
              {hotel.phone_number && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#1a56db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Need help? Call us</p>
                    <a href={`tel:${hotel.phone_number}`} className="text-sm font-semibold text-[#1a56db] hover:underline">
                      {hotel.phone_number}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}