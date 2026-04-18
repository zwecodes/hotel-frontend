"use client";

import { useState, useEffect, useCallback } from "react";
import BookingCard from "@/components/BookingCard";
import api from "@/lib/api";
import toast from "react-hot-toast";

const TABS = ["all", "confirmed", "pending", "cancelled"];

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => { document.title = "My Bookings | HotelBook"; }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/bookings/my");
      if (res.data.success) setBookings(res.data.data);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      const res = await api.patch(`/api/bookings/${id}/cancel`);
      if (res.data.success) {
        toast.success("Booking cancelled successfully");
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const handlePay = async (id) => {
    setPayingId(id);
    try {
      const res = await api.patch(`/api/bookings/${id}/pay`);
      if (res.data.success) {
        toast.success("Payment successful! 🎉");
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab] = tab === "all" ? bookings.length : bookings.filter((b) => b.status === tab).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-[#1a56db] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-blue-100 text-sm mt-1">
            {loading ? "Loading..." : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#1a56db] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                  activeTab === tab ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                  </div>
                </div>
                <div className="h-14 bg-gray-100 rounded-xl" />
                <div className="flex justify-between pt-2">
                  <div className="h-6 bg-gray-200 rounded w-24" />
                  <div className="h-9 bg-gray-200 rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {activeTab === "all" ? "No bookings yet" : `No ${activeTab} bookings`}
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              {activeTab === "all"
                ? "Your bookings will appear here once you make a reservation."
                : `You don't have any ${activeTab} bookings.`}
            </p>
            {activeTab === "all" && (
              <a
                href="/hotels"
                className="inline-block px-6 py-2.5 bg-[#1a56db] text-white text-sm font-semibold rounded-lg hover:bg-[#1e429f] transition-colors"
              >
                Browse Hotels
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onPay={handlePay}
                cancelling={cancellingId === booking.id}
                paying={payingId === booking.id}
                onExpired={fetchBookings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}