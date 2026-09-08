export type BreathingPhase = "Inhale" | "Hold" | "Exhale" | "Hold (Empty)";

export interface BreathingStep {
  phase: BreathingPhase;
  durationSeconds: number;
  label: string;
  instruction: string;
}

export interface BreathingExercise {
  id: string;
  queryParam: string;
  name: string;
  tagline: string;
  description: string;
  patternSummary: string;
  benefits: string;
  recommendedCycles: number;
  steps: BreathingStep[];
  colorTheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    circleFrom: string;
    circleTo: string;
  };
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: "4-7-8",
    queryParam: "478",
    name: "4-7-8 Breathing",
    tagline: "Natural tranquilizer for the nervous system",
    description: "Inhale gently through your nose, hold your breath steadily, then release a slow, soothing exhale.",
    patternSummary: "Inhale 4s • Hold 7s • Exhale 8s",
    benefits: "Eases intense anxiety, racing thoughts, and promotes deep physical relaxation before sleep.",
    recommendedCycles: 4,
    colorTheme: {
      bg: "bg-[#fff7f9]",
      border: "border-[#d6c1c5]/40 hover:border-[#8a4b5e]",
      badgeBg: "bg-[#fee0f5]",
      badgeText: "text-[#8a4b5e]",
      circleFrom: "#8a4b5e",
      circleTo: "#d98fa3",
    },
    steps: [
      {
        phase: "Inhale",
        durationSeconds: 4,
        label: "Breathe In",
        instruction: "Inhale softly through your nose, expanding your belly and chest.",
      },
      {
        phase: "Hold",
        durationSeconds: 7,
        label: "Hold Breath",
        instruction: "Gently hold the breath in stillness without straining.",
      },
      {
        phase: "Exhale",
        durationSeconds: 8,
        label: "Breathe Out",
        instruction: "Exhale slowly and completely through your mouth, letting all tension melt away.",
      },
    ],
  },
  {
    id: "box",
    queryParam: "box",
    name: "Box Breathing",
    tagline: "Reset focus & regain composure under pressure",
    description: "Equal four-part rhythm used by top performers to reset the stress response and regain clear focus.",
    patternSummary: "Inhale 4s • Hold 4s • Exhale 4s • Hold 4s",
    benefits: "Regulates heart rate, centers racing emotions, and grounds you during overwhelming moments.",
    recommendedCycles: 4,
    colorTheme: {
      bg: "bg-[#fff7f9]",
      border: "border-[#d6c1c5]/40 hover:border-[#61527e]",
      badgeBg: "bg-[#ebddff]",
      badgeText: "text-[#61527e]",
      circleFrom: "#61527e",
      circleTo: "#b197db",
    },
    steps: [
      {
        phase: "Inhale",
        durationSeconds: 4,
        label: "Breathe In",
        instruction: "Inhale slowly and steadily through your nose.",
      },
      {
        phase: "Hold",
        durationSeconds: 4,
        label: "Hold Breath",
        instruction: "Hold your lungs comfortably full.",
      },
      {
        phase: "Exhale",
        durationSeconds: 4,
        label: "Breathe Out",
        instruction: "Exhale smoothly and evenly.",
      },
      {
        phase: "Hold (Empty)",
        durationSeconds: 4,
        label: "Hold Empty",
        instruction: "Rest at the bottom of your breath in calm stillness.",
      },
    ],
  },
  {
    id: "equal",
    queryParam: "equal",
    name: "Equal Breathing (Sama Vritti)",
    tagline: "Cultivate balance, harmony, and presence",
    description: "A rhythmic, balanced practice where your inhales and exhales match in calm, steady duration.",
    patternSummary: "Inhale 5s • Exhale 5s",
    benefits: "Brings equilibrium to the nervous system, clears mental fatigue, and centers awareness.",
    recommendedCycles: 6,
    colorTheme: {
      bg: "bg-[#fff7f9]",
      border: "border-[#d6c1c5]/40 hover:border-[#76546b]",
      badgeBg: "bg-[#ffe7f7]",
      badgeText: "text-[#76546b]",
      circleFrom: "#76546b",
      circleTo: "#c98fa3",
    },
    steps: [
      {
        phase: "Inhale",
        durationSeconds: 5,
        label: "Breathe In",
        instruction: "Smooth, continuous inhale filling your lungs evenly.",
      },
      {
        phase: "Exhale",
        durationSeconds: 5,
        label: "Breathe Out",
        instruction: "Smooth, continuous exhale releasing at the same steady pace.",
      },
    ],
  },
  {
    id: "deep",
    queryParam: "deep",
    name: "Deep Breathing (Diaphragmatic)",
    tagline: "Stimulate your body's natural relaxation response",
    description: "Deep belly breathing with an elongated exhale that signals your vagus nerve to lower heart rate.",
    patternSummary: "Inhale 4s • Exhale 6s",
    benefits: "Reduces physical tension in the shoulders and chest, softening the physical feeling of stress.",
    recommendedCycles: 6,
    colorTheme: {
      bg: "bg-[#fff7f9]",
      border: "border-[#d6c1c5]/40 hover:border-[#8a4b5e]",
      badgeBg: "bg-[#fee0f5]",
      badgeText: "text-[#8a4b5e]",
      circleFrom: "#8a4b5e",
      circleTo: "#e6a5b6",
    },
    steps: [
      {
        phase: "Inhale",
        durationSeconds: 4,
        label: "Deep Inhale",
        instruction: "Breathe deep into your lower belly, relaxing your shoulders.",
      },
      {
        phase: "Exhale",
        durationSeconds: 6,
        label: "Slow Exhale",
        instruction: "Release slowly, allowing your diaphragm and chest to soften completely.",
      },
    ],
  },
  {
    id: "extended",
    queryParam: "extended",
    name: "Extended Exhale",
    tagline: "Rapid nervous system down-regulation",
    description: "Doubling the length of your out-breath creates an immediate soothing brake on adrenaline.",
    patternSummary: "Inhale 4s • Exhale 8s",
    benefits: "Ideal for breaking panic, sudden agitation, or overwhelm by instantly activating parasympathetic tone.",
    recommendedCycles: 5,
    colorTheme: {
      bg: "bg-[#fff7f9]",
      border: "border-[#d6c1c5]/40 hover:border-[#665783]",
      badgeBg: "bg-[#ebddff]",
      badgeText: "text-[#665783]",
      circleFrom: "#665783",
      circleTo: "#c1a5e0",
    },
    steps: [
      {
        phase: "Inhale",
        durationSeconds: 4,
        label: "Gentle Inhale",
        instruction: "Take in a calm breath through your nose.",
      },
      {
        phase: "Exhale",
        durationSeconds: 8,
        label: "Extended Exhale",
        instruction: "Exhale twice as long like a slow sigh through softly parted lips.",
      },
    ],
  },
];

export interface Soundscape {
  id: string;
  name: string;
  description: string;
  icon: string; // Material symbol name or lucide icon identifier
  audioEngineType: "rain" | "ocean" | "forest" | "piano" | "ambient";
  color: string;
}

export const SOUNDSCAPES: Soundscape[] = [
  {
    id: "rain",
    name: "Gentle Rain",
    description: "Soft, steady rainfall on leaves for a soothing reset.",
    icon: "water_drop",
    audioEngineType: "rain",
    color: "#61527e",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    description: "Rhythmic tides washing ashore with gentle ebb and flow.",
    icon: "waves",
    audioEngineType: "ocean",
    color: "#8a4b5e",
  },
  {
    id: "forest",
    name: "Forest Breeze",
    description: "Subtle wind rustling through pine trees and tranquil nature ambience.",
    icon: "forest",
    audioEngineType: "forest",
    color: "#5b6e58",
  },
  {
    id: "piano",
    name: "Gentle Piano",
    description: "Soft, warm pentatonic chords resonant with calm contemplation.",
    icon: "piano",
    audioEngineType: "piano",
    color: "#76546b",
  },
  {
    id: "ambient",
    name: "Ambient Calm",
    description: "Lush, meditative acoustic drone with harmonic warmth.",
    icon: "spa",
    audioEngineType: "ambient",
    color: "#8a4b5e",
  },
];

export const QUICK_RESET_CONFIG = {
  durationMinutes: 2,
  exerciseId: "deep",
  title: "2-Minute Quick Reset",
  subtitle: "Take a fast, refreshing mindful break",
  description: "A gentle 2-minute deep breathing flow (4s in, 6s out) designed to lower tension when you only have a moment.",
};
