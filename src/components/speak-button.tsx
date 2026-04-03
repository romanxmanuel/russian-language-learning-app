"use client";

import { Volume2 } from "lucide-react";

type SpeakButtonProps = {
  text: string;
  rate?: number;
  className?: string;
};

export function SpeakButton({
  text,
  rate = 0.92,
  className = "",
}: SpeakButtonProps) {
  const handleSpeak = () => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const russianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ru"));
    if (russianVoice) {
      utterance.voice = russianVoice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center gap-2 rounded-full border border-line/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent ${className}`}
    >
      <Volume2 className="h-3.5 w-3.5" />
      Speak
    </button>
  );
}
