"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HotelCard from "@/components/HotelCard";
import api from "@/lib/api";

const SORT_OPTIONS = [
  { value: "star_desc",   label: "Star Rating (High to Low)" },
  { value: "price_asc",   label: "Price (Low to High)" },
  { value: "price_desc",  label: "Price (High to Low)" },
  { value: "rating_desc", label: "Guest Rating" },
];

const STAR_OPTIONS = [5, 4, 3, 2, 1];

function getDefaultDates() {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { today: fmt(today), tomorrow: fmt(tomorrow) };
}

// ── Filter panel extracted outside to prevent remount on keystroke ──
function FilterPanel({
  keyword, setKeyword,
  checkIn, setCheckIn,
  checkOut, setCheckOut,
  capacity, setCapacity,
  sort, setSort,
  starFilter, setStarFilter,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  onSearch, onClearFilters,
  todayStr,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Search</h3>
        <form onSubmit={onSearch} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Keyword</label>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="Hotel name or city"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Check-in *</label>
            <input type="date" value={checkIn} min={todayStr} onChange={e => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Check-out *</label>
            <input type="date" value={checkOut} min={checkIn || todayStr} onChange={e => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Guests</label>
            <input type="number" value={capacity} min={1} max={20} onChange={e => setCapacity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
          </div>
          <button type="submit"
            className="w-full py-2 bg-[#1a56db] text-white text-sm font-semibold rounded-lg hover:bg-[#1e429f] transition-colors">
            Search
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Sort By</h3>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] bg-white">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Star Rating</h3>
          {starFilter && (
            <button onClick={() => setStarFilter("")} className="text-xs text-[#1a56db] hover:underline">Clear</button>
          )}
        </div>
        <div className="space-y-1.5">
          {STAR_OPTIONS.map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="star" checked={starFilter === String(s)}
                onChange={() => setStarFilter(String(s))}
                className="text-[#1a56db] focus:ring-[#1a56db]"/>
              <span className="flex items-center gap-1">
                {Array.from({ length: s }).map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-1">{s} Star{s > 1 ? "s" : ""}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Price Range (฿)</h3>
        <div className="flex gap-2 items-center">
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            placeholder="Min" min={0}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
          <span className="text-gray-400 text-sm flex-shrink-0">—</span>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            placeholder="Max" min={0}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"/>
        </div>
      </div>

      {(starFilter || minPrice || maxPrice) && (
        <button onClick={onClearFilters}
          className="w-full py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          Clear All Filters
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function HotelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { today: todayStr, tomorrow: tomorrowStr } = getDefaultDates();

  // Default to today/tomorrow if no URL params
  const [keyword,    setKeyword]    = useState(searchParams.get("keyword")   || "");
  const [checkIn,    setCheckIn]    = useState(searchParams.get("check_in")  || todayStr);
  const [checkOut,   setCheckOut]   = useState(searchParams.get("check_out") || tomorrowStr);
  const [capacity,   setCapacity]   = useState(searchParams.get("capacity")  || "1");
  const [starFilter, setStarFilter] = useState("");
  const [minPrice,   setMinPrice]   = useState("");
  const [maxPrice,   setMaxPrice]   = useState("");
  const [sort,       setSort]       = useState("star_desc");
  const [page,       setPage]       = useState(1);

  const [hotels,      setHotels]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const limit      = 10;
  const totalPages = Math.ceil(total / limit);
  const hasDates   = checkIn && checkOut;

  const fetchHotels = useCallback(async (currentPage = 1) => {
    if (!checkIn || !checkOut) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        check_in:  checkIn,
        check_out: checkOut,
        page:      currentPage,
        limit,
        sort,
        ...(keyword    && { keyword }),
        ...(capacity   && { capacity }),
        ...(starFilter && { star_rating: starFilter }),
        ...(minPrice   && { min_price: minPrice }),
        ...(maxPrice   && { max_price: maxPrice }),
      });
      const res = await api.get(`/api/search?${params.toString()}`);
      if (res.data.success) {
        setHotels(res.data.data);
        setTotal(res.data.total);
        setPage(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load hotels");
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, keyword, capacity, starFilter, minPrice, maxPrice, sort]);

  useEffect(() => {
    if (hasDates) fetchHotels(1);
  }, [fetchHotels, hasDates]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      keyword, check_in: checkIn, check_out: checkOut, capacity,
    });
    router.push(`/hotels?${params.toString()}`);
    setSidebarOpen(false);
  };

  const handleClearFilters = () => {
    setStarFilter("");
    setMinPrice("");
    setMaxPrice("");
  };

  const filterPanelProps = {
    keyword, setKeyword,
    checkIn, setCheckIn,
    checkOut, setCheckOut,
    capacity, setCapacity,
    sort, setSort,
    starFilter, setStarFilter,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    onSearch: handleSearch,
    onClearFilters: handleClearFilters,
    todayStr,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a56db] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white">
            {keyword ? `Hotels matching "${keyword}"` : "Search Hotels"}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {loading ? "Searching..."
              : `${total} hotel${total !== 1 ? "s" : ""} found · ${checkIn} → ${checkOut}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            Filters & Search
          </button>
          <span className="text-sm text-gray-500">{total} result{total !== 1 ? "s" : ""}</span>
        </div>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)}/>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <FilterPanel {...filterPanelProps}/>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <FilterPanel {...filterPanelProps}/>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700">Error loading hotels</p>
                  <p className="text-xs text-red-500 mt-0.5">{error}</p>
                  <button onClick={() => fetchHotels(1)} className="mt-2 text-xs text-red-600 underline">Try again</button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
            )}

            {/* Empty */}
            {!loading && !error && hasDates && hotels.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                <svg className="w-14 h-14 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No available hotels found</h3>
                <p className="text-gray-400 text-sm mb-4">Try different dates or remove some filters.</p>
                <button onClick={handleClearFilters}
                  className="px-5 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1e429f] transition-colors">
                  Clear Filters
                </button>
              </div>
            )}

            {/* Results */}
            {!loading && !error && hotels.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.hotel_id}
                      hotel={hotel}
                      checkIn={checkIn}
                      checkOut={checkOut}
                      guests={capacity}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => fetchHotels(page - 1)} disabled={page === 1}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                        return (
                          <button key={p} onClick={() => fetchHotels(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              p === page ? "bg-[#1a56db] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}>
                            {p}
                          </button>
                        );
                      }
                      if (p === page - 2 || p === page + 2) return <span key={p} className="text-gray-400">…</span>;
                      return null;
                    })}
                    <button onClick={() => fetchHotels(page + 1)} disabled={page === totalPages}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}