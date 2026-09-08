"use client";

import { useState } from "react";
import { MapPin, Navigation, X, Search } from "lucide-react";

interface LocationPermissionProps {
  onLocationSelected: (coords: { lat: number; lng: number } | null, query?: string) => void;
  onDismiss: () => void;
}

export function LocationPermission({
  onLocationSelected,
  onDismiss,
}: LocationPermissionProps) {
  const [cityInput, setCityInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser. Please enter your city.");
      return;
    }

    setLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onLocationSelected({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Location access was denied. You can enter your city or area below.");
        } else {
          setErrorMsg("Unable to retrieve location. Please type your city name below.");
        }
      },
      { timeout: 10000 }
    );
  };

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    onLocationSelected(null, cityInput.trim());
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#d98fa3]/40 shadow-md space-y-3 relative animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-[#847376] hover:bg-[#ffeff8] hover:text-[#271624] transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#ffd9e1] flex items-center justify-center text-[#8a4b5e]">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-[#271624]">
            Find Nearby Support
          </h4>
          <p className="text-xs text-[#514346]">
            Locate verified therapists, psychologists, and clinics near you.
          </p>
        </div>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-[#ba1a1a] bg-[#ffdad6]/60 p-2 rounded-xl">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={handleRequestGeolocation}
          disabled={locating}
          className="flex-1 px-4 py-2 rounded-full bg-[#8a4b5e] text-white text-xs font-semibold hover:bg-[#733e4e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{locating ? "Locating..." : "Use My Browser Location"}</span>
        </button>

        <span className="text-center text-xs text-[#847376] self-center">or</span>

        <form onSubmit={handleCitySubmit} className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="e.g. Mumbai, Bengaluru, Delhi"
            className="flex-1 px-3.5 py-2 rounded-full bg-[#fff7f9] border border-[#d6c1c5]/60 text-xs text-[#271624] focus:outline-none focus:border-[#8a4b5e]"
          />
          <button
            type="submit"
            disabled={!cityInput.trim()}
            className="px-3 py-2 rounded-full bg-[#665783] text-white text-xs font-semibold hover:bg-[#4e3f6a] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
