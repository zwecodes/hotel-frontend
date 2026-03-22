import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#1a56db] rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                  <path d="M9 21V12h6v9" fill="#1a56db"/>
                </svg>
              </div>
              <span className="text-white font-bold text-lg">
                Hotel<span className="text-blue-400">Book</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Find and book the best hotels at the best prices. Your journey starts here.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/hotels" className="hover:text-white transition-colors">Hotels</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors cursor-default">Help Center</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Cancellation Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>&copy; {year} HotelBook. All rights reserved.</p>
          <p className="text-gray-600 text-xs">Built with Next.js &amp; Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
