"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLES = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};
const PAYMENT_STYLES = {
  paid:     "bg-green-50 text-green-700 border-green-200",
  unpaid:   "bg-orange-50 text-orange-600 border-orange-200",
  refunded: "bg-gray-50 text-gray-500 border-gray-200",
};

function Badge({ label, styleMap }) {
  const cls = styleMap?.[label] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${cls}`}>
      {label}
    </span>
  );
}

function UpdateStatusModal({ booking, onClose, onSave }) {
  const [status, setStatus]         = useState(booking.status);
  const [paymentStatus, setPayment] = useState(booking.payment_status);
  const [saving, setSaving]         = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/api/admin/bookings/${booking.id}/status`, {
        status,
        payment_status: paymentStatus,
      });
      if (res.data.success) {
        toast.success("Booking updated!");
        onSave();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Update Booking #{booking.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Booking Status</label>
            <div className="grid grid-cols-3 gap-2">
              {["confirmed", "pending", "cancelled"].map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                    status === s ? STATUS_STYLES[s] + " ring-2 ring-offset-1 ring-current" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
            <div className="grid grid-cols-3 gap-2">
              {["paid", "unpaid", "refunded"].map((s) => (
                <button key={s} onClick={() => setPayment(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                    paymentStatus === s ? PAYMENT_STYLES[s] + " ring-2 ring-offset-1 ring-current" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-[#1a56db] text-white font-semibold rounded-lg text-sm hover:bg-[#1e429f] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</>) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch]         = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/bookings");
      if (res.data.success) setBookings(res.data.data);
    } catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.user_name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) ||
      b.hotel_name?.toLowerCase().includes(q) || String(b.id).includes(q);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading..." : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
        </p>
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by guest, hotel or booking ID..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-sm">{search ? "No results found" : "No bookings yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["ID","Guest","Hotel","Rooms","Dates","Total","Status","Payment",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">{b.user_name}</p>
                      <p className="text-xs text-gray-400">{b.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap max-w-[140px] truncate">{b.hotel_name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                      {b.rooms?.map((r, i) => (
                        <span key={i} className="block text-xs whitespace-nowrap">{r.room_type} × {r.quantity}</span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <span>{formatDate(b.check_in_date)}</span>
                      <span className="block text-gray-300">→ {formatDate(b.check_out_date)}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">${Number(b.total_price).toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge label={b.status} styleMap={STATUS_STYLES} /></td>
                    <td className="px-4 py-3"><Badge label={b.payment_status} styleMap={PAYMENT_STYLES} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditTarget(b)}
                        className="px-3 py-1.5 text-xs font-medium text-[#1a56db] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <UpdateStatusModal booking={editTarget} onClose={() => setEditTarget(null)} onSave={fetchBookings} />
      )}
    </div>
  );
}