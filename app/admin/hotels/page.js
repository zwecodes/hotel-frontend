"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { uploadImage } from "@/lib/cloudinary";

// ── Helpers ──────────────────────────────────────────────
const EMPTY_HOTEL = { name: "", description: "", city: "", address: "", phone_number: "", star_rating: 3 };
const EMPTY_ROOM  = { hotel_id: "", room_type: "", price_per_night: "", capacity: 1, total_rooms: 1, description: "" };

function Stars({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < n ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// ── Reusable Modal ────────────────────────────────────────
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900 text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p className="text-gray-800 font-medium mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]";

// ── Image Manager ─────────────────────────────────────────
function ImageManager({ type, id, onClose }) {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);

  const apiBase = type === "hotel" ? `/api/admin/hotels/${id}/images` : `/api/admin/rooms/${id}/images`;

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(apiBase);
      if (res.data.success) setImages(res.data.data);
    } catch { toast.error("Failed to load images"); }
    finally { setLoading(false); }
  }, [apiBase]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        const isFirst = images.length === 0;
        await api.post(apiBase, { image_url: url, is_primary: isFirst ? 1 : 0 });
      }
      toast.success(`${files.length} image${files.length > 1 ? "s" : ""} uploaded!`);
      fetchImages();
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await api.put(`${apiBase}/${imageId}/primary`);
      toast.success("Primary image updated");
      fetchImages();
    } catch { toast.error("Failed to set primary"); }
  };

  const handleDelete = async (imageId) => {
    try {
      await api.delete(`${apiBase}/${imageId}`);
      toast.success("Image deleted");
      fetchImages();
    } catch { toast.error("Failed to delete image"); }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-[#1a56db] hover:bg-blue-50"}`}>
        <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-6 h-6 animate-spin text-[#1a56db]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span className="text-sm text-blue-600 font-medium">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span className="text-sm text-gray-500">Click to upload images <span className="text-gray-400">(multiple allowed)</span></span>
          </div>
        )}
      </label>

      {/* Image grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : images.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-4">No images yet. Upload some above.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-100">
              <img src={img.image_url} alt="" className="w-full h-28 object-cover" />
              {/* Primary badge */}
              {img.is_primary === 1 && (
                <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                  Primary
                </div>
              )}
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {img.is_primary !== 1 && (
                  <button onClick={() => handleSetPrimary(img.id)}
                    className="px-2 py-1 bg-yellow-400 text-white text-xs font-semibold rounded hover:bg-yellow-500 transition-colors">
                    Set Primary
                  </button>
                )}
                <button onClick={() => handleDelete(img.id)}
                  className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}

// ── Hotel Form ────────────────────────────────────────────
function HotelForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Hotel name is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (form.phone_number && !/^[0-9+\-\s()]{7,20}$/.test(form.phone_number))
      e.phone_number = "Invalid phone number format";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Hotel Name *">
        <input className={`${inputCls} ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
          value={form.name} onChange={e => set("name", e.target.value)} placeholder="Grand Hotel" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </Field>
      <Field label="City *">
        <input className={`${inputCls} ${errors.city ? "border-red-400 focus:ring-red-400" : ""}`}
          value={form.city} onChange={e => set("city", e.target.value)} placeholder="Bangkok" />
        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
      </Field>
      <Field label="Address *">
        <input className={`${inputCls} ${errors.address ? "border-red-400 focus:ring-red-400" : ""}`}
          value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main Street" />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </Field>
      <Field label="Phone Number">
        <input className={`${inputCls} ${errors.phone_number ? "border-red-400 focus:ring-red-400" : ""}`}
          value={form.phone_number} onChange={e => set("phone_number", e.target.value)} placeholder="+66 2 123 4567" />
        {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
      </Field>
      <Field label="Star Rating *">
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map(s => (
            <button key={s} type="button" onClick={() => set("star_rating", s)}
              className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-colors ${form.star_rating >= s ? "bg-yellow-400 border-yellow-400 text-white" : "border-gray-200 text-gray-400 hover:border-yellow-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Description">
        <textarea rows={3} className={inputCls} value={form.description}
          onChange={e => set("description", e.target.value)} placeholder="A beautiful hotel..." />
      </Field>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#1a56db] text-white font-semibold rounded-lg hover:bg-[#1e429f] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {loading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</>) : "Save Hotel"}
      </button>
    </form>
  );
}

// ── Room Form ─────────────────────────────────────────────
function RoomForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.room_type.trim()) e.room_type = "Room type is required";
    if (!form.price_per_night || Number(form.price_per_night) <= 0)
      e.price_per_night = "Price must be greater than 0";
    if (!form.capacity || Number(form.capacity) < 1)
      e.capacity = "Capacity must be at least 1";
    if (!form.total_rooms || Number(form.total_rooms) < 1)
      e.total_rooms = "Total rooms must be at least 1";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Room Type *">
        <input className={`${inputCls} ${errors.room_type ? "border-red-400 focus:ring-red-400" : ""}`}
          value={form.room_type} onChange={e => set("room_type", e.target.value)} placeholder="Deluxe Suite" />
        {errors.room_type && <p className="text-red-500 text-xs mt-1">{errors.room_type}</p>}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price / Night (฿) *">
          <input type="number" min="0" step="0.01"
            className={`${inputCls} ${errors.price_per_night ? "border-red-400 focus:ring-red-400" : ""}`}
            value={form.price_per_night} onChange={e => set("price_per_night", e.target.value)} placeholder="1500" />
          {errors.price_per_night && <p className="text-red-500 text-xs mt-1">{errors.price_per_night}</p>}
        </Field>
        <Field label="Capacity *">
          <input type="number" min="1"
            className={`${inputCls} ${errors.capacity ? "border-red-400 focus:ring-red-400" : ""}`}
            value={form.capacity} onChange={e => set("capacity", e.target.value)} />
          {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
        </Field>
      </div>
      <Field label="Total Rooms *">
        <input type="number" min="1"
          className={`${inputCls} ${errors.total_rooms ? "border-red-400 focus:ring-red-400" : ""}`}
          value={form.total_rooms} onChange={e => set("total_rooms", e.target.value)} />
        {errors.total_rooms && <p className="text-red-500 text-xs mt-1">{errors.total_rooms}</p>}
      </Field>
      <Field label="Description">
        <textarea rows={2} className={inputCls} value={form.description}
          onChange={e => set("description", e.target.value)} placeholder="Room details..." />
      </Field>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#1a56db] text-white font-semibold rounded-lg hover:bg-[#1e429f] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {loading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</>) : "Save Room"}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function AdminHotelsPage() {
  const [hotels, setHotels]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [expandedHotel, setExpandedHotel] = useState(null);
  const [hotelRooms, setHotelRooms]       = useState({});
  const [hotelModal, setHotelModal]       = useState(null);
  const [roomModal, setRoomModal]         = useState(null);
  const [imageModal, setImageModal]       = useState(null); // { type: "hotel"|"room", id }
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [saving, setSaving]               = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/hotels");
      if (res.data.success) setHotels(res.data.data);
    } catch { toast.error("Failed to load hotels"); }
    finally { setLoading(false); }
  }, []);

  const fetchRooms = useCallback(async (hotelId) => {
    try {
      const res = await api.get(`/api/hotels/${hotelId}/rooms`);
      if (res.data.success) setHotelRooms(p => ({ ...p, [hotelId]: res.data.data }));
    } catch { toast.error("Failed to load rooms"); }
  }, []);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const toggleRooms = (hotelId) => {
    if (expandedHotel === hotelId) { setExpandedHotel(null); return; }
    setExpandedHotel(hotelId);
    if (!hotelRooms[hotelId]) fetchRooms(hotelId);
  };

  const handleHotelSubmit = async (form) => {
    setSaving(true);
    try {
      if (hotelModal.mode === "add") {
        const res = await api.post("/api/admin/hotels", form);
        if (res.data.success) { toast.success("Hotel added!"); fetchHotels(); setHotelModal(null); }
      } else {
        const res = await api.put(`/api/admin/hotels/${hotelModal.data.id}`, form);
        if (res.data.success) { toast.success("Hotel updated!"); fetchHotels(); setHotelModal(null); }
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save hotel"); }
    finally { setSaving(false); }
  };

  const handleRoomSubmit = async (form) => {
    setSaving(true);
    try {
      if (roomModal.mode === "add") {
        const res = await api.post("/api/admin/rooms", { ...form, hotel_id: roomModal.hotelId });
        if (res.data.success) { toast.success("Room added!"); fetchRooms(roomModal.hotelId); setRoomModal(null); }
      } else {
        const res = await api.put(`/api/admin/rooms/${roomModal.data.id}`, form);
        if (res.data.success) { toast.success("Room updated!"); fetchRooms(roomModal.hotelId); setRoomModal(null); }
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save room"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget.type === "hotel") {
        const res = await api.delete(`/api/admin/hotels/${deleteTarget.id}`);
        if (res.data.success) { toast.success("Hotel deleted"); fetchHotels(); if (expandedHotel === deleteTarget.id) setExpandedHotel(null); }
      } else {
        const res = await api.delete(`/api/admin/rooms/${deleteTarget.id}`);
        if (res.data.success) { toast.success("Room deleted"); fetchRooms(deleteTarget.hotelId); }
      }
      setDeleteTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hotels & Rooms</h1>
          <p className="text-sm text-gray-400 mt-0.5">{hotels.length} hotel{hotels.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setHotelModal({ mode: "add", data: { ...EMPTY_HOTEL } })}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-semibold rounded-lg hover:bg-[#1e429f] transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Hotel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
          </div>
        ) : hotels.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <p className="text-sm">No hotels yet. Add your first hotel!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Hotel</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">City</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Rating</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hotels.map((hotel) => (
                  <Fragment key={hotel.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{hotel.name}</td>
                      <td className="px-4 py-3 text-gray-500">{hotel.city}</td>
                      <td className="px-4 py-3"><Stars n={hotel.star_rating} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Manage Images */}
                          <button onClick={() => setImageModal({ type: "hotel", id: hotel.id, name: hotel.name })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            Images
                          </button>
                          {/* Manage Rooms */}
                          <button onClick={() => toggleRooms(hotel.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              expandedHotel === hotel.id ? "bg-blue-100 text-[#1a56db]" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#1a56db]"
                            }`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            Rooms
                            <svg className={`w-3 h-3 transition-transform ${expandedHotel === hotel.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                          </button>
                          {/* Edit */}
                          <button onClick={() => setHotelModal({ mode: "edit", data: hotel })}
                            className="p-1.5 text-gray-400 hover:text-[#1a56db] hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          {/* Delete */}
                          <button onClick={() => setDeleteTarget({ type: "hotel", id: hotel.id })}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Rooms panel */}
                    {expandedHotel === hotel.id && (
                      <tr key={`rooms-${hotel.id}`}>
                        <td colSpan={4} className="bg-blue-50/40 px-6 py-4 border-b border-blue-100">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">
                              Rooms for <span className="text-[#1a56db]">{hotel.name}</span>
                              {hotelRooms[hotel.id] && <span className="ml-2 text-gray-400 font-normal">({hotelRooms[hotel.id].length})</span>}
                            </h3>
                            <button onClick={() => setRoomModal({ mode: "add", hotelId: hotel.id, data: { ...EMPTY_ROOM } })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white text-xs font-semibold rounded-lg hover:bg-[#1e429f] transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                              </svg>
                              Add Room
                            </button>
                          </div>

                          {!hotelRooms[hotel.id] ? (
                            <div className="text-sm text-gray-400 py-2 animate-pulse">Loading rooms...</div>
                          ) : hotelRooms[hotel.id].length === 0 ? (
                            <p className="text-sm text-gray-400">No rooms yet. Add your first room!</p>
                          ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {hotelRooms[hotel.id].map((room) => (
                                <div key={room.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                  {/* Room primary image */}
                                  {room.images && room.images.length > 0 ? (
                                    <img src={room.images.find(i => i.is_primary)?.image_url || room.images[0].image_url}
                                      alt={room.room_type} className="w-full h-24 object-cover" />
                                  ) : (
                                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                      </svg>
                                    </div>
                                  )}
                                  <div className="p-3">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <p className="font-semibold text-gray-800 text-sm">{room.room_type}</p>
                                      <div className="flex gap-1">
                                        {/* Images button */}
                                        <button onClick={() => setImageModal({ type: "room", id: room.id, name: room.room_type })}
                                          className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                          </svg>
                                        </button>
                                        {/* Edit button */}
                                        <button onClick={() => setRoomModal({ mode: "edit", hotelId: hotel.id, data: room })}
                                          className="p-1 text-gray-400 hover:text-[#1a56db] hover:bg-blue-50 rounded transition-colors">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                          </svg>
                                        </button>
                                        {/* Delete button */}
                                        <button onClick={() => setDeleteTarget({ type: "room", id: room.id, hotelId: hotel.id })}
                                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-base font-bold text-[#1a56db]">฿{Number(room.price_per_night).toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                      <span>👥 {room.capacity} guests</span>
                                      <span>🛏 {room.total_rooms} rooms</span>
                                    </div>
                                    {room.description && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{room.description}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hotel Modal */}
      {hotelModal && (
        <Modal title={hotelModal.mode === "add" ? "Add New Hotel" : "Edit Hotel"} onClose={() => setHotelModal(null)}>
          <HotelForm initial={hotelModal.data} onSubmit={handleHotelSubmit} loading={saving} />
        </Modal>
      )}

      {/* Room Modal */}
      {roomModal && (
        <Modal title={roomModal.mode === "add" ? "Add New Room" : "Edit Room"} onClose={() => setRoomModal(null)}>
          <RoomForm initial={roomModal.data} onSubmit={handleRoomSubmit} loading={saving} />
        </Modal>
      )}

      {/* Image Manager Modal */}
      {imageModal && (
        <Modal title={`Manage Images — ${imageModal.name}`} onClose={() => { setImageModal(null); if (imageModal.type === "room") fetchRooms(expandedHotel); }} wide>
          <ImageManager type={imageModal.type} id={imageModal.id} onClose={() => { setImageModal(null); if (imageModal.type === "room") fetchRooms(expandedHotel); }} />
        </Modal>
      )}

      {/* Confirm Delete */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete this ${deleteTarget.type}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}