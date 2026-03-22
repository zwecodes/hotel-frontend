"use client";

export default function RoomCard({ room, quantity, onQuantityChange }) {
  const maxQty = room.available_rooms ?? room.total_rooms ?? 10;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Room image */}
      <div className="sm:w-40 sm:flex-shrink-0 h-32 sm:h-auto rounded-lg overflow-hidden bg-gray-100">
        <img
          src={`https://picsum.photos/seed/room${room.id}/300/200`}
          alt={room.room_type}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Room info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-base">{room.room_type}</h3>
          <div className="text-right">
            <div className="text-xl font-bold text-[#1a56db]">
              ${Number(room.price_per_night).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">per night</div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Up to {room.capacity} guests
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {maxQty} available
          </span>
        </div>

        {room.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{room.description}</p>
        )}

        {/* Quantity selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Rooms:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              disabled={quantity === 0}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>
            <button
              onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
              disabled={quantity >= maxQty}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {quantity > 0 && (
            <span className="ml-auto text-sm font-semibold text-[#1a56db]">
              Subtotal: ${(Number(room.price_per_night) * quantity).toLocaleString()}/night
            </span>
          )}
        </div>
      </div>
    </div>
  );
}