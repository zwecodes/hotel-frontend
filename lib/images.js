const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
  "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800&q=80",
];

const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
  "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600&q=80",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=80",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80",
  "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=600&q=80",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80",
];

/**
 * Optimize a Cloudinary URL by injecting transformation params.
 * Non-Cloudinary URLs (Unsplash fallbacks) pass through unchanged.
 */
function optimizeCloudinaryUrl(url, { width = 800, height, crop = "fill", gravity = "auto" } = {}) {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;

  const transforms = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `c_${crop}`,
    `g_${gravity}`,
    "q_auto",
    "f_auto",
  ].filter(Boolean).join(",");

  return url.replace("/upload/", `/upload/${transforms}/`);
}

// ── Legacy helpers — still used as fallbacks ──────────────
export function getHotelImage(id) {
  return HOTEL_IMAGES[id % HOTEL_IMAGES.length];
}

export function getRoomImage(id) {
  return ROOM_IMAGES[id % ROOM_IMAGES.length];
}

// ── Hotel image — optimized for gallery/hero (wide, landscape) ──
export function getHotelPrimaryImage(hotel) {
  const id = hotel?.hotel_id ?? hotel?.id;

  if (hotel?.images?.length > 0) {
    const primary = hotel.images.find(img => img.is_primary === 1);
    const url = primary?.image_url ?? hotel.images[0].image_url;
    return optimizeCloudinaryUrl(url, { width: 1200, height: 800, crop: "fill", gravity: "center" });
  }

  if (hotel?.primary_image_url) {
    return optimizeCloudinaryUrl(hotel.primary_image_url, { width: 800, height: 500, crop: "fill", gravity: "center" });
  }

  return HOTEL_IMAGES[(id ?? 0) % HOTEL_IMAGES.length];
}

// ── Room image — optimized for room card thumbnail ────────
export function getRoomPrimaryImage(room) {
  if (room?.images?.length > 0) {
    const primary = room.images.find(img => img.is_primary === 1);
    const url = primary?.image_url ?? room.images[0].image_url;
    return optimizeCloudinaryUrl(url, { width: 400, height: 300, crop: "fill" });
  }
  return ROOM_IMAGES[(room?.id ?? 0) % ROOM_IMAGES.length];
}

// ── Optimize any arbitrary Cloudinary URL ─────────────────
export function optimizeImage(url, options = {}) {
  return optimizeCloudinaryUrl(url, options);
}