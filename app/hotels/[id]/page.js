"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoomCard from "@/components/RoomCard";
import api from "@/lib/api";
import toast from "react-hot-toast";

function StarRating({ rating, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i}
          onClick={() => interactive && onRate && onRate(i + 1)}
          onMouseEnter={() => interactive && setHovered(i + 1)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`${interactive ? "w-6 h-6 cursor-pointer" : "w-4 h-4"} transition-colors ${i < display ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

const AMENITIES = [
  { icon: "🌐", label: "Free WiFi" }, { icon: "🅿️", label: "Free Parking" },
  { icon: "🏊", label: "Swimming Pool" }, { icon: "🏋️", label: "Fitness Center" },
  { icon: "🍳", label: "Breakfast" }, { icon: "❄️", label: "Air Conditioning" },
  { icon: "🛎️", label: "24hr Room Service" }, { icon: "🚭", label: "Non-smoking Rooms" },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function getDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { today: fmt(today), tomorrow: fmt(tomorrow) };
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const { today, tomorrow } = getDefaultDates();

  // Dates — from URL if present, otherwise default to today/tomorrow
  const [checkIn, setCheckIn]   = useState(searchParams.get("check_in") || today);
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") || tomorrow);
  const [guests, setGuests]     = useState(searchParams.get("guests") || "1");

  const [hotel, setHotel]       = useState(null);
  const [rooms, setRooms]       = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading]   = useState(true);

  const [reviewRating, setReviewRating]     = useState(5);
  const [reviewComment, setReviewComment]   = useState("");
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
    ])
      .then(([hotelRes, roomsRes, reviewsRes]) => {
        if (hotelRes.data.success) setHotel(hotelRes.data.data);
        if (roomsRes.data.success) {
          setRooms(roomsRes.data.data);
          const init = {};
          roomsRes.data.data.forEach((r) => { init[r.id] = 0; });
          setQuantities(init);
        }
        if (reviewsRes.data.success) setReviews(reviewsRes.data.data);
      })
      .catch(() => toast.error("Failed to load hotel details"))
      .finally(() => setLoading(false));
  }, [id, checkIn, checkOut]);

  const nights = Math.max(
    1,
    checkIn && checkOut
      ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
      : 1
  );

  const selectedRooms = rooms.filter((r) => quantities[r.id] > 0);
  const totalPerNight = selectedRooms.reduce((sum, r) => sum + Number(r.price_per_night) * quantities[r.id], 0);
  const grandTotal = totalPerNight * nights;

  const handleQuantityChange = (roomId, qty) => setQuantities((prev) => ({ ...prev, [roomId]: qty }));

  const handleBookNow = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/hotels/${id}`);
      return;
    }
    if (selectedRooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }

    const bookingData = {
      hotel,
      rooms: selectedRooms.map((r) => ({
        room_id: r.id,
        room_type: r.room_type,
        quantity: quantities[r.id],
        price_per_night: r.price_per_night,
      })),
      check_in_date: checkIn,
      check_out_date: checkOut,
      number_of_guests: Number(guests),
      nights,
      total_price: grandTotal,
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
        setReviews((prev) => [{ id: res.data.review_id, rating: reviewRating, comment: reviewComment.trim(), user_name: "You", created_at: new Date().toISOString() }, ...prev]);
        setReviewComment(""); setReviewRating(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally { setSubmittingReview(false); }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-6">
        <div className="h-72 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg">Hotel not found.</p>
        <button onClick={() => router.push("/hotels")} className="mt-4 text-[#1a56db] underline text-sm">Back to Hotels</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-36">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 lg:h-96 bg-gray-200 overflow-hidden">
        <img src={`https://picsum.photos/seed/hotel${id}hero/1200/500`} alt={hotel.name} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-5xl mx-auto flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow mb-1">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {hotel.address}, {hotel.city}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <div className="flex items-center gap-1 mb-0.5">
                {Array.from({ length: hotel.star_rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="text-white text-xs">{hotel.star_rating}-Star Hotel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hotel info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this hotel</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{hotel.description || "A wonderful place to stay during your visit."}</p>
              {hotel.phone_number && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  {hotel.phone_number}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((a) => (
                  <div key={a.label} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{a.icon}</span><span>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Date & Guest picker (always visible) ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Select Your Stay</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Check-in</label>
              <input type="date" value={checkIn} min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Check-out</label>
              <input type="date" value={checkOut} min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Guests</label>
              <input type="number" value={guests} min={1} max={20}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
            </div>
          </div>
          {checkIn && checkOut && (
            <p className="text-xs text-blue-600 mt-3 font-medium">
              ✓ {nights} night{nights !== 1 ? "s" : ""} · {formatDate(checkIn)} → {formatDate(checkOut)}
            </p>
          )}
        </div>

        {/* Rooms */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h2>
          {rooms.length === 0 ? (
            <p className="text-gray-400 text-sm">No rooms available at this hotel.</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} quantity={quantities[room.id] || 0}
                  onQuantityChange={(qty) => handleQuantityChange(room.id, qty)}/>
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
          {isAuthenticated && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Your Rating</label>
                  <StarRating rating={reviewRating} interactive onRate={setReviewRating}/>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Comment</label>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    rows={3} placeholder="Share your experience..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] resize-none"/>
                </div>
                <button type="submit" disabled={submittingReview}
                  className="px-5 py-2 bg-[#1a56db] text-white text-sm font-semibold rounded-lg hover:bg-[#1e429f] disabled:opacity-60 transition-colors">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 shadow-sm">
              <p className="text-sm">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#1a56db] text-xs font-bold uppercase">{review.user_name?.[0] ?? "?"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{review.user_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating}/>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky booking bar */}
      {rooms.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              {selectedRooms.length === 0 ? (
                <p className="text-sm text-gray-400">Select rooms above to see pricing</p>
              ) : (
                <div>
                  <p className="text-xs text-gray-400">{selectedRooms.length} room type{selectedRooms.length > 1 ? "s" : ""} · {nights} night{nights > 1 ? "s" : ""}</p>
                  <p className="text-xl font-bold text-gray-900">${grandTotal.toLocaleString()}<span className="text-sm font-normal text-gray-400 ml-1">total</span></p>
                  <p className="text-xs text-gray-400">${totalPerNight.toLocaleString()} / night</p>
                </div>
              )}
            </div>
            <button onClick={handleBookNow}
              className="px-8 py-3 bg-[#1a56db] text-white font-semibold rounded-xl hover:bg-[#1e429f] transition-colors shadow-md text-sm">
              {isAuthenticated ? "Book Now" : "Login to Book"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}