"use client";

import { useState, useEffect } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import api from "@/lib/api";
import toast from "react-hot-toast";

function fmt(n) {
  return Number(n ?? 0).toLocaleString();
}

function fmtMoney(n) {
  const num = Number(n ?? 0);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MonthLabel(str) {
  // str may be "2025-03" or "March 2025" — normalise to short label
  if (!str) return "";
  const parts = str.split("-");
  if (parts.length === 2) {
    const m = parseInt(parts[1], 10);
    return `${MONTH_NAMES[m - 1] ?? str} ${parts[0]}`;
  }
  return str;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/dashboard")
      .then((res) => { if (res.data.success) setData(res.data.data); })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalRevenue, totalBookings, totalUsers, totalHotels,
    bookingStats, monthlyRevenue, topHotels,
  } = data;

  const { confirmedBookings = 0, pendingBookings = 0, cancelledBookings = 0 } = bookingStats ?? {};

  // For the bar chart — find the max revenue to compute bar widths
  const maxRevenue = Math.max(...(monthlyRevenue ?? []).map(m => Number(m.revenue ?? 0)), 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of your hotel platform</p>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Revenue"
          value={fmtMoney(totalRevenue)}
          color="blue"
          trend="All time earnings"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <AdminStatCard
          label="Total Bookings"
          value={fmt(totalBookings)}
          color="green"
          trend={`${fmt(confirmedBookings)} confirmed`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <AdminStatCard
          label="Total Users"
          value={fmt(totalUsers)}
          color="purple"
          trend="Registered accounts"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <AdminStatCard
          label="Total Hotels"
          value={fmt(totalHotels)}
          color="orange"
          trend="Active properties"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* ── Booking status breakdown ────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Booking Status Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Confirmed", value: confirmedBookings, color: "bg-green-500", light: "bg-green-50", text: "text-green-700" },
            { label: "Pending",   value: pendingBookings,   color: "bg-yellow-400", light: "bg-yellow-50", text: "text-yellow-700" },
            { label: "Cancelled", value: cancelledBookings, color: "bg-red-400",   light: "bg-red-50",    text: "text-red-600"   },
          ].map((s) => {
            const pct = totalBookings > 0 ? Math.round((s.value / totalBookings) * 100) : 0;
            return (
              <div key={s.label} className={`${s.light} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.text}`}>{fmt(s.value)}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{s.label}</p>
                <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom two panels ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly revenue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue</h2>
          {!monthlyRevenue?.length ? (
            <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {[...monthlyRevenue].reverse().map((row, i) => {
                const rev = Number(row.revenue ?? 0);
                const barPct = Math.round((rev / maxRevenue) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20 flex-shrink-0 text-right">
                      {MonthLabel(row.month)}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#1a56db] rounded-full"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-16 text-right flex-shrink-0">
                      {fmtMoney(rev)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top hotels */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Hotels by Revenue</h2>
          {!topHotels?.length ? (
            <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topHotels.slice(0, 5).map((hotel, i) => (
                <div key={hotel.id} className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    i === 0 ? "bg-yellow-100 text-yellow-600"
                    : i === 1 ? "bg-gray-100 text-gray-500"
                    : i === 2 ? "bg-orange-100 text-orange-500"
                    : "bg-gray-50 text-gray-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{hotel.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a56db] rounded-full"
                        style={{
                          width: `${Math.round((Number(hotel.revenue) / Number(topHotels[0].revenue || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {fmtMoney(hotel.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}