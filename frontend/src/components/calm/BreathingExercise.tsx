"use client";

import React, { useState, useEffect, useId } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  X,
  Sparkles,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { BreathingExercise as BreathingExerciseType } from "./calm-config";

interface BreathingExerciseProps {
  exercise: BreathingExerciseType;
  onClose: () => void;
  onSelectAnother?: () => void;
}

export function BreathingExercise({
  exercise,
  onClose,
  onSelectAnother,
}: BreathingExerciseProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepSecondsLeft, setStepSecondsLeft] = useState(
    exercise.steps[0].durationSeconds
  );
  const [currentCycle, setCurrentCycle] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = exercise.steps[currentStepIdx];
  const targetCycles = exercise.recommendedCycles || 4;

  // Sync state if exercise changes
  useEffect(() => {
    setCurrentStepIdx(0);
    setStepSecondsLeft(exercise.steps[0].durationSeconds);
    setCurrentCycle(1);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
  }, [exercise]);

  // Main countdown timer interval
  useEffect(() => {
    if (isPaused || isCompleted) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      setStepSecondsLeft((prev) => {
        if (prev <= 1) {
          // Advance to next step
          const nextIdx = currentStepIdx + 1;
          if (nextIdx < exercise.steps.length) {
            setCurrentStepIdx(nextIdx);
            return exercise.steps[nextIdx].durationSeconds;
          } else {
            // Completed a full cycle
            if (currentCycle >= targetCycles) {
              setIsCompleted(true);
              return 0;
            } else {
              setCurrentCycle((c) => c + 1);
              setCurrentStepIdx(0);
              return exercise.steps[0].durationSeconds;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isCompleted, currentStepIdx, currentCycle, targetCycles, exercise.steps]);

  const handleRestart = () => {
    setCurrentStepIdx(0);
    setStepSecondsLeft(exercise.steps[0].durationSeconds);
    setCurrentCycle(1);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine circle scale and styling based on phase
  const isHolding = currentStep.phase.startsWith("Hold");
  const isExhaling = currentStep.phase === "Exhale";
  const isInhaling = currentStep.phase === "Inhale";

  let circleScaleClass = "scale-100";
  if (isInhaling) {
    circleScaleClass = "scale-125 md:scale-135";
  } else if (isHolding) {
    circleScaleClass = currentStep.phase === "Hold" ? "scale-125 md:scale-135" : "scale-95";
  } else if (isExhaling) {
    circleScaleClass = "scale-95";
  }

  // Calculate phase transition duration
  const transitionDurationStyle = {
    transitionDuration: `${currentStep.durationSeconds}s`,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.name} practice session`}
      className="fixed inset-0 z-50 bg-[#271624]/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#fffbfb] w-full max-w-2xl rounded-3xl sm:rounded-[36px] border border-[#d6c1c5]/50 shadow-2xl overflow-hidden flex flex-col my-auto relative">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#d6c1c5]/30 flex items-center justify-between bg-[#fff7f9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fee0f5] text-[#8a4b5e] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#271624] leading-tight">
                {exercise.name}
              </h2>
              <p className="text-[11px] text-[#847376] font-medium">
                Mindful Reset • Cycle {currentCycle} of {targetCycles}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close breathing session"
            className="w-8 h-8 rounded-full bg-white hover:bg-[#fee0f5] text-[#514346] border border-[#d6c1c5]/40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Completion Screen State */}
        {isCompleted ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner animate-bounce-short">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md">
              <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                Session Complete
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#271624]">
                Nice work. You gave yourself a few quiet minutes.
              </h3>
              <p className="text-sm text-[#514346] leading-relaxed">
                Notice how your body feels right now. Taking intentional pauses creates space for calm and mental clarity.
              </p>
            </div>

            {/* Session Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md bg-[#fff7f9] p-4 rounded-2xl border border-[#d6c1c5]/40">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-[#847376]">Practice</span>
                <span className="font-semibold text-xs text-[#271624] mt-0.5">{exercise.name}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-[#847376]">Duration</span>
                <span className="font-semibold text-xs text-[#8a4b5e] mt-0.5">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex flex-col items-center col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-[#847376]">Completed</span>
                <span className="font-semibold text-xs text-emerald-700 mt-0.5">{targetCycles} Cycles</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-full border border-[#d6c1c5] bg-white hover:bg-[#fff7f9] text-xs font-semibold text-[#514346] transition-colors cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat Practice</span>
              </button>

              {onSelectAnother && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectAnother();
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#8a4b5e] hover:bg-[#733e4e] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Try Another Practice
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-[#61527e] hover:bg-[#4d3f66] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Back to Toolkit
              </button>
            </div>
          </div>
        ) : (
          /* Active Interactive Breathing State */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-between min-h-[460px]">
            {/* Screen Reader Live Announcement */}
            <div className="sr-only" aria-live="polite">
              {currentStep.label}, {stepSecondsLeft} seconds remaining. Cycle {currentCycle} of {targetCycles}.
            </div>

            {/* Current Phase Label & Guide Instruction */}
            <div className="text-center space-y-1">
              <span
                className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${exercise.colorTheme.badgeBg} ${exercise.colorTheme.badgeText}`}
              >
                {currentStep.phase}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#271624]">
                {currentStep.label}
              </h3>
              <p className="text-xs sm:text-sm text-[#76546b] max-w-sm mx-auto font-medium">
                {currentStep.instruction}
              </p>
            </div>

            {/* Main Expanding / Contracting Breathing Visual */}
            <div className="relative my-6 flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              {/* Outer Subtle Ambient Ring */}
              <div className="absolute inset-0 rounded-full border border-[#d6c1c5]/30 animate-pulse-slow pointer-events-none" />

              {/* Pulsing Guide Ring */}
              <div
                style={transitionDurationStyle}
                className={`absolute inset-4 rounded-full border-2 border-dashed border-[#8a4b5e]/40 transition-transform ease-in-out ${circleScaleClass}`}
              />

              {/* Central Dynamic Circle */}
              <div
                style={transitionDurationStyle}
                className={`w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#8a4b5e] to-[#d98fa3] shadow-lg flex flex-col items-center justify-center text-white transition-all ease-in-out ${circleScaleClass}`}
              >
                <span className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-none drop-shadow-xs">
                  {stepSecondsLeft}s
                </span>
                <span className="text-[11px] uppercase tracking-widest font-semibold opacity-90 mt-1">
                  {currentStep.phase}
                </span>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full space-y-4">
              {/* Progress Counters & Timeline */}
              <div className="flex items-center justify-between text-xs font-semibold text-[#847376] px-2">
                <span>Cycle {currentCycle} / {targetCycles}</span>
                <span>Elapsed: {formatTime(elapsedSeconds)}</span>
              </div>

              {/* Interactive Control Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  aria-label={isPaused ? "Resume breathing exercise" : "Pause breathing exercise"}
                  className="px-6 py-2.5 rounded-full bg-[#8a4b5e] hover:bg-[#733e4e] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  aria-label="Restart exercise from beginning"
                  className="p-2.5 rounded-full bg-white hover:bg-[#fee0f5] text-[#514346] border border-[#d6c1c5]/60 transition-colors cursor-pointer"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCompleted(true)}
                  aria-label="End exercise and view summary"
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-[#fee0f5] text-[#8a4b5e] text-xs font-semibold border border-[#d6c1c5]/60 transition-colors cursor-pointer"
                >
                  Complete
                </button>
              </div>

              {/* Non-Medical Disclaimer Banner */}
              <div className="bg-[#fff7f9] border border-[#d6c1c5]/30 rounded-xl p-2.5 text-center">
                <p className="text-[11px] text-[#847376] leading-relaxed">
                  <ShieldCheck className="w-3 h-3 inline-block mr-1 text-[#8a4b5e] -mt-0.5" />
                  Keep your breathing comfortable. If you feel dizzy or breathless, stop and resume your normal breathing rhythm.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
