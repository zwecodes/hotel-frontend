"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HotelCard from "@/components/HotelCard";
import api from "@/lib/api";
import { getHotelPrimaryImage } from "@/lib/images";

const RECENTLY_VIEWED_KEY = "recentlyViewedHotels";
const MAX_RECENT = 5;

function getDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { today: fmt(today), tomorrow: fmt(tomorrow) };
}

// ── Recently Viewed helpers (used by hotel detail page too) ──
export function addRecentlyViewed(hotel) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((h) => h.id !== hotel.id);
    const updated = [hotel, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Recently Viewed Strip ─────────────────────────────────
function RecentlyViewedSection({ today, tomorrow }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(getRecentlyViewed());
  }, []);

  if (recent.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
          <p className="text-gray-500 text-sm mt-0.5">Pick up where you left off</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(RECENTLY_VIEWED_KEY);
            setRecent([]);
          }}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          Clear history
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {recent.map((hotel) => (
          <Link
            key={hotel.id}
            href={`/hotels/${hotel.id}?check_in=${today}&check_out=${tomorrow}`}
            className="flex-shrink-0 w-52 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
          >
            <div className="h-32 overflow-hidden bg-gray-100">
              <img
                src={getHotelPrimaryImage(hotel)}
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-800 truncate">{hotel.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{hotel.city}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { today, tomorrow } = getDefaultDates();

  const [form, setForm] = useState({
    keyword: "",
    check_in: today,
    check_out: tomorrow,
    capacity: 1,
  });

  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  useEffect(() => {
    document.title = "HotelBook — Find & Book Hotels";
  }, []);

  useEffect(() => {
    api.get("/api/hotels")
      .then((res) => { if (res.data.success) setHotels(res.data.data.slice(0, 6)); })
      .catch(() => {})
      .finally(() => setLoadingHotels(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      keyword:   form.keyword,
      check_in:  form.check_in,
      check_out: form.check_out,
      capacity:  form.capacity,
    });
    router.push(`/hotels?${params.toString()}`);
  };

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-[#1a56db] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full opacity-20"/>
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-blue-400 rounded-full opacity-20"/>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
              Find Your Perfect Stay
            </h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto">
              Search hundreds of hotels and get the best deals for your next trip.
            </p>
          </div>

          {/* Search card */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destination</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </span>
                  <input type="text" name="keyword" value={form.keyword} onChange={handleChange}
                    placeholder="Search hotel name or city"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"/>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-in</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <input type="date" name="check_in" value={form.check_in} min={today}
                    onChange={handleChange} required
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"/>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-out</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <input type="date" name="check_out" value={form.check_out} min={form.check_in || today}
                    onChange={handleChange} required
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"/>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guests</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </span>
                  <input type="number" name="capacity" value={form.capacity} min={1} max={20}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"/>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center sm:justify-end">
              <button type="submit"
                className="w-full sm:w-auto px-10 py-2.5 bg-[#1a56db] hover:bg-[#1e429f] text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg">
                Search Hotels
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🏨", label: "500+ Hotels" },
              { icon: "💳", label: "Best Price Guarantee" },
              { icon: "🔒", label: "Secure Booking" },
              { icon: "🌟", label: "24/7 Support" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENTLY VIEWED ───────────────────────────────── */}
      <RecentlyViewedSection today={today} tomorrow={tomorrow} />

      {/* ── FEATURED HOTELS ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Hotels</h2>
            <p className="text-gray-500 text-sm mt-1">Hand-picked stays for every traveller</p>
          </div>
          <a href="/hotels" className="text-sm font-medium text-[#1a56db] hover:underline flex items-center gap-1">
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        {loadingHotels ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-44 bg-gray-200"/>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"/>
                  <div className="h-3 bg-gray-200 rounded w-1/2"/>
                  <div className="flex justify-between pt-2">
                    <div className="h-6 bg-gray-200 rounded w-20"/>
                    <div className="h-8 bg-gray-200 rounded w-24"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No hotels found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-[#1a56db] mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to find your perfect hotel?</h2>
          <p className="text-blue-100 mb-6 text-sm sm:text-base">Join thousands of travellers who book with HotelBook every day.</p>
          <a href="/auth/register"
            className="inline-block px-8 py-3 bg-white text-[#1a56db] font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md">
            Get Started — It&apos;s Free
          </a>
        </div>
      </section>
    </div>
  );
}