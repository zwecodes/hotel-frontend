"use client";
import { useState } from "react";
import { getRoomPrimaryImage } from "@/lib/images";

export default function RoomCard({ room, quantity, onQuantityChange }) {
  const maxQty = room.available_rooms ?? room.total_rooms ?? 10;

  const images = room.images && room.images.length > 0
    ? room.images
    : [{ id: "fallback", image_url: getRoomPrimaryImage(room) }];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = (e) => {
    e?.stopPropagation();
    setActiveIndex(i => (i - 1 + images.length) % images.length);
  };
  const next = (e) => {
    e?.stopPropagation();
    setActiveIndex(i => (i + 1) % images.length);
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Room image with arrows + click to enlarge */}
        <div className="relative sm:w-40 sm:flex-shrink-0 h-32 sm:h-auto rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
          onClick={() => setLightboxOpen(true)}>
          <img
            src={images[activeIndex].image_url}
            alt={room.room_type}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Enlarge hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-1.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
              </svg>
            </div>
          </div>

          {/* Arrows — only when multiple images */}
          {images.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button onClick={next}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              {/* Dots */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${i === activeIndex ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
                ))}
              </div>

              {/* Counter */}
              <div className="absolute top-1.5 right-1.5 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full leading-none z-10">
                {activeIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>

        {/* Room info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-base">{room.room_type}</h3>
            <div className="text-right">
              <div className="text-xl font-bold text-[#1a56db]">
                ฿{Number(room.price_per_night).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">per night</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
              Up to {room.capacity} guests
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              {maxQty} available
            </span>
          </div>

          {room.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{room.description}</p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Rooms:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
                disabled={quantity === 0}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/>
                </svg>
              </button>
              <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>
              <button onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
            {quantity > 0 && (
              <span className="ml-auto text-sm font-semibold text-[#1a56db]">
                Subtotal: ฿{(Number(room.price_per_night) * quantity).toLocaleString()}/night
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}>

          {/* Prev */}
          {images.length > 1 && (
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="flex flex-col items-center gap-4 px-16" onClick={e => e.stopPropagation()}>
            <img
              src={images[activeIndex].image_url}
              alt={room.room_type}
              className="max-w-4xl max-h-[80vh] w-full object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white font-semibold text-sm">{room.room_type}</p>
            {images.length > 1 && (
              <p className="text-white/50 text-xs">{activeIndex + 1} / {images.length}</p>
            )}
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          )}

          {/* Close */}
          <button onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2"
              onClick={e => e.stopPropagation()}>
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveIndex(i)}
                  className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${i === activeIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"}`}>
                  <img src={img.image_url} alt="" className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}