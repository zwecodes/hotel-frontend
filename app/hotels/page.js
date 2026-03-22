"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HotelCard from "@/components/HotelCard";
import api from "@/lib/api";

// Group search results (rooms) by hotel and pick lowest price
function groupRoomsToHotels(rooms) {
  const map = {};
  for (const room of rooms) {
    if (!map[room.hotel_id]) {
      map[room.hotel_id] = {
        id: room.hotel_id,
        name: room.hotel_name,
        city: room.city,
        address: room.address,
        star_rating: room.star_rating,
        min_price: room.price_per_night,
      };
    } else {
      if (room.price_per_night < map[room.hotel_id].min_price) {
        map[room.hotel_id].min_price = room.price_per_night;
      }
    }
  }
  return Object.values(map);
}

const STAR_OPTIONS = [5, 4, 3, 2, 1];

export default function HotelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial query params from URL
  const initialCity = searchParams.get("city") || "";
  const initialCheckIn = searchParams.get("check_in") || "";
  const initialCheckOut = searchParams.get("check_out") || "";
  const initialGuests = searchParams.get("guests") || "1";

  // Search/filter state
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [starFilter, setStarFilter] = useState([]); // array of selected star ratings
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  // Results state
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      // Use /api/search if we have dates (required by backend), else /api/hotels
      if (checkIn && checkOut) {
        setIsSearchMode(true);
        const params = new URLSearchParams({
          check_in: checkIn,
          check_out: checkOut,
          ...(cityFilter && { city: cityFilter }),
          ...(guests && { capacity: guests }),
        });
        const res = await api.get(`/api/search?${params.toString()}`);
        if (res.data.success) {
          setHotels(groupRoomsToHotels(res.data.data));
        }
      } else {
        setIsSearchMode(false);
        const res = await api.get("/api/hotels");
        if (res.data.success) {
          setHotels(res.data.data);
        }
      }
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, cityFilter, guests]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Apply star filter client-side (search API doesn't have a star filter param)
  const filtered = hotels.filter((h) => {
    if (starFilter.length === 0) return true;
    return starFilter.includes(h.star_rating);
  });

  const handleStarToggle = (star) => {
    setStarFilter((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      city: cityFilter,
      check_in: checkIn,
      check_out: checkOut,
      guests,
    });
    router.push(`/hotels?${params.toString()}`);
    fetchHotels();
    setSidebarOpen(false);
  };

  const clearFilters = () => {
    setStarFilter([]);
    setCityFilter("");
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Search fields */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Search
        </h3>
        <form onSubmit={handleSearch} className="space-y-3">
          {/* City */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">City</label>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Any city"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
            />
          </div>
          {/* Check-in */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
            />
          </div>
          {/* Check-out */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
            />
          </div>
          {/* Guests */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Guests</label>
            <input
              type="number"
              value={guests}
              min={1}
              max={20}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-[#1a56db] text-white text-sm font-semibold rounded-lg hover:bg-[#1e429f] transition-colors"
          >
            Update Search
          </button>
        </form>
      </div>

      {/* Star rating filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Star Rating
          </h3>
          {starFilter.length > 0 && (
            <button
              onClick={() => setStarFilter([])}
              className="text-xs text-[#1a56db] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-2">
          {STAR_OPTIONS.map((star) => (
            <label key={star} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={starFilter.includes(star)}
                onChange={() => handleStarToggle(star)}
                className="w-4 h-4 rounded border-gray-300 text-[#1a56db] focus:ring-[#1a56db]"
              />
              <span className="flex items-center gap-1">
                {Array.from({ length: star }).map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-1">{star} Star{star > 1 ? "s" : ""}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {(starFilter.length > 0 || cityFilter) && (
        <button
          onClick={clearFilters}
          className="w-full py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-[#1a56db] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white">
            {isSearchMode && cityFilter
              ? `Hotels in ${cityFilter}`
              : "All Hotels"}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {loading ? "Searching..." : `${filtered.length} propert${filtered.length === 1 ? "y" : "ies"} found`}
            {checkIn && checkOut && (
              <span className="ml-2 opacity-80">· {checkIn} → {checkOut}</span>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {(starFilter.length > 0 || cityFilter) && (
              <span className="bg-[#1a56db] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {starFilter.length + (cityFilter ? 1 : 0)}
              </span>
            )}
          </button>
          <span className="text-sm text-gray-500">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Mobile filter drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <FilterPanel />
            </div>
          </aside>

          {/* Results grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                    <div className="h-44 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="flex justify-between pt-2">
                        <div className="h-6 bg-gray-200 rounded w-20" />
                        <div className="h-8 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                <svg className="w-14 h-14 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No hotels found</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Try adjusting your filters or search for a different city.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1e429f] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}