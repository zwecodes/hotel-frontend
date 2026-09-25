"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  useEffect(() => {
    document.title = "Forgot Password | HotelBook";
  }, []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", { email: email.trim() });
      setDone(true);
      if (res.data?.dev_reset_url) {
        setDevUrl(res.data.dev_reset_url);
      }
      toast.success(res.data?.message || "Check your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1a56db] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Hotel<span className="text-[#1a56db]">Book</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your account email. If it exists, we will create a reset link.
          </p>

          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                If that email is registered, a reset link is ready. Check the API logs in development,
                or use the link below when shown.
              </p>
              {devUrl && (
                <a
                  href={devUrl}
                  className="block text-sm text-[#1a56db] break-all font-medium hover:underline"
                >
                  {devUrl}
                </a>
              )}
              <Link href="/auth/login" className="inline-block text-sm font-semibold text-[#1a56db] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1a56db] text-white font-semibold rounded-xl hover:bg-[#1e429f] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
