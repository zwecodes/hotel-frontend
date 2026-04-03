import Link from "next/link";
import { getHotelPrimaryImage } from "@/lib/images";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function HotelCard({ hotel, checkIn, checkOut, guests }) {
  const id          = hotel.hotel_id   ?? hotel.id;
  const name        = hotel.hotel_name ?? hotel.name;
  const city        = hotel.city;
  const starRating  = hotel.star_rating;
  const avgRating   = hotel.average_rating;
  const totalReviews= hotel.total_reviews;
  const priceFrom   = hotel.price_from ?? hotel.min_price;
  const availCount  = hotel.available_rooms_count;

  // Build query string — only append params that exist
  const params = new URLSearchParams();
  if (checkIn)  params.set("check_in",  checkIn);
  if (checkOut) params.set("check_out", checkOut);
  if (guests)   params.set("guests",    guests);
  const query = params.toString() ? `?${params.toString()}` : "";

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={getHotelPrimaryImage(hotel)}
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1 shadow-sm">
          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span className="text-xs font-semibold text-gray-700">{starRating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 line-clamp-1">{name}</h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span className="truncate">{city}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={starRating} />
          {avgRating > 0 && (
            <span className="text-xs text-gray-500">
              ⭐ {Number(avgRating).toFixed(1)}
              {totalReviews > 0 && <span className="text-gray-400"> ({totalReviews} review{totalReviews !== 1 ? "s" : ""})</span>}
            </span>
          )}
        </div>

        {availCount > 0 && (
          <p className="text-xs text-green-600 font-medium mb-2">
            ✓ {availCount} room type{availCount !== 1 ? "s" : ""} available
          </p>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            {priceFrom ? (
              <>
                <span className="text-xs text-gray-400">From</span>
                <div className="text-lg font-bold text-[#1a56db]">
                  ฿{Number(priceFrom).toLocaleString()}
                  <span className="text-xs font-normal text-gray-400">/night</span>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-400">Price on request</span>
            )}
          </div>
          <Link
            href={`/hotels/${id}${query}`}
            className="px-3 py-1.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1e429f] transition-colors"
          >
            View Hotel
          </Link>
        </div>
      </div>
    </div>
  );
}