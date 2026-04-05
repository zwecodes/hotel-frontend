import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">

        {/* Hotel illustration */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Building */}
            <svg className="w-32 h-32 text-blue-100" fill="currentColor" viewBox="0 0 128 128">
              <rect x="24" y="40" width="80" height="72" rx="4" fill="#dbeafe"/>
              <rect x="36" y="24" width="56" height="20" rx="4" fill="#bfdbfe"/>
              {/* Windows */}
              <rect x="36" y="56" width="16" height="14" rx="2" fill="#93c5fd"/>
              <rect x="60" y="56" width="16" height="14" rx="2" fill="#93c5fd"/>
              <rect x="84" y="56" width="8" height="14" rx="2" fill="#93c5fd"/>
              <rect x="36" y="80" width="16" height="14" rx="2" fill="#93c5fd"/>
              <rect x="60" y="80" width="16" height="14" rx="2" fill="#93c5fd"/>
              <rect x="84" y="80" width="8" height="14" rx="2" fill="#93c5fd"/>
              {/* Door */}
              <rect x="52" y="96" width="24" height="16" rx="3" fill="#60a5fa"/>
              {/* Flag */}
              <rect x="63" y="8" width="2" height="18" fill="#94a3b8"/>
              <path d="M65 8 L80 14 L65 20 Z" fill="#1a56db"/>
            </svg>

            {/* Question mark badge */}
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#1a56db] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">?</span>
            </div>
          </div>
        </div>

        {/* 404 number */}
        <div className="relative mb-4">
          <p className="text-8xl font-black text-[#1a56db] opacity-10 absolute inset-0 flex items-center justify-center select-none">
            404
          </p>
          <p className="text-8xl font-black text-[#1a56db] relative">
            404
          </p>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          This room doesn&apos;t exist
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Looks like the page you&apos;re looking for has checked out.
          It may have been moved, deleted, or never existed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/"
            className="w-full sm:w-auto px-6 py-3 bg-[#1a56db] text-white font-semibold rounded-xl hover:bg-[#1e429f] transition-colors shadow-sm text-sm">
            Back to Home
          </Link>
          <Link href="/hotels"
            className="w-full sm:w-auto px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Browse Hotels
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3">Maybe you were looking for:</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { href: "/hotels", label: "Hotels" },
              { href: "/auth/login", label: "Login" },
              { href: "/my-bookings", label: "My Bookings" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="text-sm text-[#1a56db] hover:underline font-medium">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}