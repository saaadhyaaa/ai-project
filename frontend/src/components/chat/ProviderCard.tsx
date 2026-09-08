"use client";

import { ProviderCardData } from "@/lib/api";
import { MapPin, ExternalLink, ShieldCheck } from "lucide-react";

interface ProviderCardProps {
  provider: ProviderCardData;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const mapsUrl =
    provider.maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      provider.name + (provider.address ? ` ${provider.address}` : "")
    )}`;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#f8daef] soft-glow flex flex-col justify-between gap-3 transition-all hover:border-[#d98fa3]/50">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#ffeff8] flex items-center justify-center text-[#8a4b5e] shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-serif font-bold text-sm text-[#271624] leading-snug">
              {provider.name}
            </h4>
          </div>
          <span className="text-[10px] font-semibold text-[#665783] bg-[#dcc9fd]/40 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Grounded</span>
          </span>
        </div>

        {provider.description && (
          <p className="text-xs text-[#514346] leading-relaxed pl-9">
            {provider.description}
          </p>
        )}

        {provider.address && (
          <p className="text-[11px] text-[#847376] pl-9 flex items-center gap-1">
            <span>{provider.address}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#ffe7f7] text-[11px] pl-1">
        <span className="text-[#847376] font-medium text-[10px]">
          Source: Google Maps
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8a4b5e] text-white font-semibold text-xs hover:bg-[#733e4e] transition-colors shadow-xs"
        >
          <span>View on Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
