"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Square,
  Music,
} from "lucide-react";
import { SOUNDSCAPES, Soundscape } from "./calm-config";
import { soundEngine } from "./sound-engine";

export function SoundPlayer() {
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(60); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);

  // Sync volume with sound engine
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
      soundEngine.setVolume(0);
    } else {
      setIsMuted(false);
      soundEngine.setVolume(val / 100);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      soundEngine.setVolume((volume || 50) / 100);
    } else {
      setIsMuted(true);
      soundEngine.setVolume(0);
    }
  };

  const handlePlaySound = (sound: Soundscape) => {
    if (activeSoundId === sound.id && isPlaying) {
      // Pause current
      soundEngine.pause();
      setIsPlaying(false);
    } else if (activeSoundId === sound.id && !isPlaying) {
      // Resume current
      soundEngine.resume();
      setIsPlaying(true);
    } else {
      // Switch sound
      setActiveSoundId(sound.id);
      soundEngine.setVolume(isMuted ? 0 : volume / 100);
      const success = soundEngine.play(sound.audioEngineType);
      setIsPlaying(success);
    }
  };

  const handleStopAll = () => {
    soundEngine.stop();
    setActiveSoundId(null);
    setIsPlaying(false);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Allow sound to persist across quick tab clicks if user desires or stop cleanly on unmount
    };
  }, []);

  const activeSound = SOUNDSCAPES.find((s) => s.id === activeSoundId);

  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-[#fff7f9] border border-[#d6c1c5]/40 shadow-xs flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebddff] text-[#61527e] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calming Soundscapes</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#271624]">
            Gentle Soundscapes
          </h2>
          <p className="text-xs sm:text-sm text-[#514346] mt-1 max-w-xl leading-relaxed">
            Procedural nature sounds and ambient tones designed to soften mental chatter and create a peaceful space.
          </p>
        </div>

        {/* Global Volume & Stop Controls */}
        <div className="flex items-center gap-3 bg-white/90 px-4 py-2.5 rounded-2xl border border-[#d6c1c5]/40 shadow-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="text-[#514346] hover:text-[#8a4b5e] transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#8a4b5e]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#514346]" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Sound volume control"
            className="w-20 sm:w-28 h-1.5 bg-[#d6c1c5]/50 rounded-lg appearance-none cursor-pointer accent-[#8a4b5e]"
          />
          <span className="text-[11px] font-semibold text-[#847376] w-7 text-right">
            {isMuted ? "0%" : `${volume}%`}
          </span>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStopAll}
              title="Stop all sounds"
              aria-label="Stop audio playback"
              className="ml-1 p-1 rounded-lg bg-[#fee0f5] text-[#8a4b5e] hover:bg-[#8a4b5e] hover:text-white transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Currently Playing Status Banner */}
      {activeSound && isPlaying && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#fee0f5]/80 to-[#ebddff]/80 border border-[#d98fa3]/40">
          <div className="flex items-center gap-3">
            {/* Animated Sound Bars */}
            <div className="flex items-end gap-1 h-4 w-4 shrink-0 pb-0.5">
              <span className="w-1 bg-[#8a4b5e] rounded-full animate-[soundbar_0.8s_ease-in-out_infinite]" />
              <span className="w-1 bg-[#8a4b5e] rounded-full animate-[soundbar_1.2s_ease-in-out_infinite]" />
              <span className="w-1 bg-[#8a4b5e] rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#271624] block">
                Now Playing: {activeSound.name}
              </span>
              <span className="text-[10px] text-[#76546b]">
                Plays in background while you breathe or reflect
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePlaySound(activeSound)}
            className="px-3 py-1 rounded-full bg-[#8a4b5e] text-white text-[11px] font-semibold hover:bg-[#733e4e] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Pause className="w-3 h-3 fill-current" />
            <span>Pause</span>
          </button>
        </div>
      )}

      {/* Soundscapes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {SOUNDSCAPES.map((sound) => {
          const isThisActive = activeSoundId === sound.id;
          const isThisPlaying = isThisActive && isPlaying;

          return (
            <div
              key={sound.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                isThisPlaying
                  ? "bg-white border-[#8a4b5e] shadow-md ring-1 ring-[#8a4b5e]/30"
                  : "bg-white/70 hover:bg-white border-[#d6c1c5]/40 hover:border-[#8a4b5e]/40 shadow-xs"
              }`}
            >
              <div>
                {/* Header Icon + Play/Pause Action */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      isThisPlaying
                        ? "bg-[#fee0f5] text-[#8a4b5e]"
                        : "bg-[#fff7f9] text-[#514346] group-hover:text-[#8a4b5e]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {sound.icon}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlaySound(sound)}
                    aria-label={isThisPlaying ? `Pause ${sound.name}` : `Play ${sound.name}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isThisPlaying
                        ? "bg-[#8a4b5e] text-white shadow-xs"
                        : "bg-[#fff7f9] hover:bg-[#fee0f5] text-[#8a4b5e] border border-[#d6c1c5]/40"
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Name & Description */}
                <h3 className="font-serif text-sm font-bold text-[#271624] mb-1">
                  {sound.name}
                </h3>
                <p className="text-[11px] text-[#514346] leading-relaxed line-clamp-2">
                  {sound.description}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="pt-3 mt-3 border-t border-[#d6c1c5]/20 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#847376]">
                  {isThisPlaying ? (
                    <span className="text-emerald-700">● Active</span>
                  ) : (
                    "Soundscape"
                  )}
                </span>
                <span className="text-[10px] text-[#847376] font-medium">Ambient</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
