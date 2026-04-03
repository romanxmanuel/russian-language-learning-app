"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AudioLines,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Compass,
  Flame,
  Languages,
  MessageSquareMore,
  Mic,
  NotebookPen,
  Orbit,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { SpeakButton } from "@/components/speak-button";
import type {
  CheckpointResult,
  DashboardSnapshot,
  DialogueScenario,
  PronunciationFeedback,
  ReviewOutcome,
} from "@/lib/types";
import { cn, formatPercent, formatScore } from "@/lib/utils";

type DialogueEntry = {
  id: string;
  role: "coach" | "learner" | "local";
  text: string;
  translation?: string;
  feedback?: string[];
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload as T;
}

function starterDialogueFeed(scenario: DialogueScenario): DialogueEntry[] {
  return scenario.sampleLines.map((line, index) => ({
    id: `${scenario.id}-${index}`,
    role: line.speaker,
    text: line.russian,
    translation: line.translation,
  }));
}

function DimensionBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-ink-soft">{formatPercent(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-accent/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-[#dd7f52]"
          style={{ width: `${Math.max(8, Math.round(value * 100))}%` }}
        />
      </div>
    </div>
  );
}

function ReviewButton({
  outcome,
  onClick,
}: {
  outcome: ReviewOutcome;
  onClick: () => void;
}) {
  const styles: Record<ReviewOutcome, string> = {
    again: "border-accent/40 bg-accent/10 text-accent",
    hard: "border-warning/40 bg-warning/10 text-warning",
    good: "border-success/40 bg-success/10 text-success",
    easy: "border-foreground/20 bg-white/70 text-foreground",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${styles[outcome]}`}
    >
      {outcome}
    </button>
  );
}

export function AcceleratorShell({
  initialDashboard,
}: {
  initialDashboard: DashboardSnapshot;
}) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [transcriptRevealed, setTranscriptRevealed] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [selectedPronunciationId, setSelectedPronunciationId] = useState(
    initialDashboard.mission.pronunciationFocus[0]?.id ?? "",
  );
  const [attemptText, setAttemptText] = useState("");
  const [pronunciationFeedback, setPronunciationFeedback] =
    useState<PronunciationFeedback | null>(null);
  const [dialogueInput, setDialogueInput] = useState("");
  const [dialogueFeed, setDialogueFeed] = useState<DialogueEntry[]>(
    starterDialogueFeed(initialDashboard.mission.scenario),
  );
  const [checkpoint, setCheckpoint] = useState<CheckpointResult | null>(
    initialDashboard.lastCheckpoint,
  );
  const [onboarding, setOnboarding] = useState({
    name: initialDashboard.profile?.name ?? "Roman",
    dailyMinutes: initialDashboard.profile?.dailyMinutes ?? 45,
    motivation:
      initialDashboard.profile?.motivation ??
      "Speak confidently in real-world Russian situations.",
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "America/New_York",
  });

  useEffect(() => {
    setDialogueFeed(starterDialogueFeed(dashboard.mission.scenario));
    setTranscriptRevealed(false);
    setReviewIndex(0);
    setSelectedPronunciationId(dashboard.mission.pronunciationFocus[0]?.id ?? "");
    setAttemptText("");
    setPronunciationFeedback(null);
  }, [dashboard.mission.pronunciationFocus, dashboard.mission.scenario]);

  useEffect(() => {
    setCheckpoint(dashboard.lastCheckpoint);
  }, [dashboard.lastCheckpoint]);

  const mission = dashboard.mission;
  const progress = dashboard.progress;
  const activeReview = mission.reviewQueue[reviewIndex] ?? null;
  const selectedChunk =
    mission.pronunciationFocus.find((chunk) => chunk.id === selectedPronunciationId) ??
    mission.pronunciationFocus[0];

  function runMutation(task: () => Promise<void>) {
    startTransition(() => {
      void task().catch((error) => {
        setStatusMessage(error instanceof Error ? error.message : "Request failed");
      });
    });
  }

  function applyDashboard(nextDashboard: DashboardSnapshot, message?: string) {
    setDashboard(nextDashboard);
    if (message) {
      setStatusMessage(message);
    }
  }

  function handleOnboardingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runMutation(async () => {
      const response = await requestJson<{ dashboard: DashboardSnapshot }>("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(onboarding),
      });
      applyDashboard(response.dashboard, "Adaptive mission generated.");
    });
  }

  function handleMissionEvent(
    eventType:
      | "session-start"
      | "listen-pass"
      | "reveal-transcript"
      | "reflection-complete",
    minutesSpent: number,
    payload?: Record<string, unknown>,
  ) {
    runMutation(async () => {
      const response = await requestJson<{ dashboard: DashboardSnapshot }>("/api/daily-mission", {
        method: "POST",
        body: JSON.stringify({ eventType, minutesSpent, payload }),
      });
      applyDashboard(response.dashboard);
    });
  }

  function handleReviewGrade(outcome: ReviewOutcome) {
    if (!activeReview) {
      return;
    }

    runMutation(async () => {
      const response = await requestJson<{ dashboard: DashboardSnapshot }>("/api/review/grade", {
        method: "POST",
        body: JSON.stringify({
          chunkId: activeReview.chunkId,
          outcome,
          minutesSpent: 3,
        }),
      });
      applyDashboard(response.dashboard, `Review graded as ${outcome}.`);
      setReviewIndex((current) =>
        Math.min(current + 1, Math.max(0, response.dashboard.mission.reviewQueue.length - 1)),
      );
    });
  }

  function handlePronunciationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChunk || attemptText.trim().length === 0) {
      return;
    }

    runMutation(async () => {
      const response = await requestJson<{
        dashboard: DashboardSnapshot;
        feedback: PronunciationFeedback;
      }>("/api/pronunciation/attempt", {
        method: "POST",
        body: JSON.stringify({
          chunkId: selectedChunk.id,
          targetText: selectedChunk.russian,
          attemptText,
        }),
      });
      setPronunciationFeedback(response.feedback);
      applyDashboard(response.dashboard, "Pronunciation attempt scored.");
    });
  }

  function handleDialogueSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialogueInput.trim().length === 0) {
      return;
    }

    const learnerTurn = dialogueInput.trim();
    setDialogueFeed((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "learner", text: learnerTurn },
    ]);
    setDialogueInput("");

    runMutation(async () => {
      const response = await requestJson<{
        dashboard: DashboardSnapshot;
        response: {
          coachReply: string;
          coachTranslation: string;
          feedback: string[];
        };
      }>("/api/dialogue/turn", {
        method: "POST",
        body: JSON.stringify({
          scenarioId: mission.scenario.id,
          userTurn: learnerTurn,
        }),
      });
      setDialogueFeed((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "coach",
          text: response.response.coachReply,
          translation: response.response.coachTranslation,
          feedback: response.response.feedback,
        },
      ]);
      applyDashboard(response.dashboard);
    });
  }

  function handleCheckpoint() {
    runMutation(async () => {
      const response = await requestJson<{
        dashboard: DashboardSnapshot;
        result: CheckpointResult;
      }>("/api/assessment/checkpoint", {
        method: "POST",
        body: JSON.stringify({ week: mission.week }),
      });
      setCheckpoint(response.result);
      applyDashboard(response.dashboard, "Checkpoint saved.");
    });
  }

  return (
    <main className="grid-lines min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
        <header className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="glass-panel rounded-[2.25rem] p-7 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-[0.26em] text-white">
                Russian Accelerator
              </span>
              <span className="rounded-full border border-line/80 bg-white/70 px-3 py-1 text-xs font-semibold text-ink-soft">
                8-week A2 foundation, not fake fluency
              </span>
            </div>
            <h1 className="display-face mt-5 max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Learn Russian with a tighter loop, harsher honesty, and better feedback.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-soft md:text-xl">
              The system stays narrow on purpose: listen first, retrieve hard, speak early, reveal text late,
              and recycle the same chunks until they stop feeling translated.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-accent px-5 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Current week</p>
                <p className="mt-3 text-4xl font-bold">{mission.week}/8</p>
                <p className="mt-2 text-sm text-white/80">{mission.theme}</p>
              </div>
              <div className="rounded-[1.5rem] border border-line/80 bg-white/75 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-soft">Readiness</p>
                <p className="mt-3 text-4xl font-bold text-foreground">
                  {formatScore(mission.readinessScore)}
                </p>
                <p className="mt-2 text-sm text-ink-soft">Adaptive score from current focus chunks.</p>
              </div>
              <div className="rounded-[1.5rem] border border-line/80 bg-white/75 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-soft">Mission loop</p>
                <p className="mt-3 text-2xl font-bold text-foreground">Listen → Reuse</p>
                <p className="mt-2 text-sm text-ink-soft">One stable loop with different content.</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#pronunciation-lab" className="rounded-full border border-line/80 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">Pronunciation Lab</a>
              <a href="#chunk-forge" className="rounded-full border border-line/80 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">Chunk Forge</a>
              <a href="#input-theater" className="rounded-full border border-line/80 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">Input Theater</a>
              <a href="#conversation-dojo" className="rounded-full border border-line/80 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">Conversation Dojo</a>
              <a href="#mission-review" className="rounded-full border border-line/80 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">Mission Review</a>
            </div>
          </section>

          <aside className="glass-panel rounded-[2.25rem] p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-accent">Coach pulse</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">
                  {dashboard.profile ? dashboard.profile.name : "Preview learner"}
                </h2>
              </div>
              <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                <Orbit className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-ink-soft">{mission.coachNote}</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.4rem] border border-line/80 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-accent" />
                    Daily mission
                  </span>
                  <span>{dashboard.profile?.dailyMinutes ?? 45} min</span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{mission.objective}</p>
              </div>
              <div className="rounded-[1.4rem] border border-line/80 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-accent" />
                    Streak
                  </span>
                  <span>{progress.missionStreak} days</span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {dashboard.profile
                    ? `${progress.totalMinutes} total focused minutes logged.`
                    : "Complete onboarding to start logging real progress."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleMissionEvent("session-start", 1)}
                className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
              >
                Start today’s mission
              </button>
              <button
                type="button"
                onClick={handleCheckpoint}
                className="rounded-full border border-line/80 bg-white/75 px-5 py-3 text-sm font-bold text-foreground transition hover:border-accent hover:text-accent"
              >
                Save checkpoint
              </button>
            </div>
            {statusMessage ? (
              <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                {statusMessage}
              </p>
            ) : null}
          </aside>
        </header>
        {!dashboard.profile ? (
          <section className="glass-panel mt-6 rounded-[2rem] p-6 md:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                  Onboarding
                </p>
                <h2 className="mt-2 text-3xl font-bold">Generate the first real mission.</h2>
                <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
                  This prototype runs in preview mode until you save a learner profile. Once you do,
                  the scheduler starts persisting mastery, review timing, transcript reveal behavior,
                  and speaking data.
                </p>
              </div>
              <form onSubmit={handleOnboardingSubmit} className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-semibold text-foreground">Name</span>
                  <input
                    value={onboarding.name}
                    onChange={(event) =>
                      setOnboarding((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-line/80 bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-semibold text-foreground">Daily minutes</span>
                  <input
                    type="number"
                    min={20}
                    max={90}
                    value={onboarding.dailyMinutes}
                    onChange={(event) =>
                      setOnboarding((current) => ({
                        ...current,
                        dailyMinutes: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-line/80 bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground">Primary motivation</span>
                  <textarea
                    value={onboarding.motivation}
                    onChange={(event) =>
                      setOnboarding((current) => ({ ...current, motivation: event.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-line/80 bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep disabled:opacity-60"
                >
                  {isPending ? "Building mission..." : "Save learner + build mission"}
                </button>
              </form>
            </div>
          </section>
        ) : null}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <section id="pronunciation-lab" className="glass-panel rounded-[2rem] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Module 01
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Pronunciation Lab</h2>
                </div>
                <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                  <Mic className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  {mission.pronunciationFocus.map((chunk) => (
                    <button
                      key={chunk.id}
                      type="button"
                      onClick={() => setSelectedPronunciationId(chunk.id)}
                      className={cn(
                        "w-full rounded-[1.4rem] border px-4 py-4 text-left transition",
                        selectedChunk?.id === chunk.id
                          ? "border-accent bg-accent/8"
                          : "border-line/70 bg-white/70 hover:border-accent/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold">{chunk.russian}</p>
                          <p className="mt-1 text-sm text-ink-soft">{chunk.translation}</p>
                        </div>
                        <SpeakButton text={chunk.russian} />
                      </div>
                      <p className="mt-3 text-xs font-mono text-ink-soft">{chunk.stressHint}</p>
                    </button>
                  ))}
                </div>
                {selectedChunk ? (
                  <div className="rounded-[1.6rem] border border-line/80 bg-white/75 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      Target phrase
                    </p>
                    <h3 className="mt-2 text-3xl font-bold">{selectedChunk.russian}</h3>
                    <p className="mt-2 text-sm text-ink-soft">{selectedChunk.translation}</p>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">{selectedChunk.notes}</p>
                    <form onSubmit={handlePronunciationSubmit} className="mt-5 space-y-4">
                      <textarea
                        value={attemptText}
                        onChange={(event) => setAttemptText(event.target.value)}
                        rows={4}
                        placeholder="Type what the learner produced..."
                        className="w-full rounded-[1.4rem] border border-line/80 bg-white px-4 py-4 outline-none transition focus:border-accent"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep disabled:opacity-60"
                      >
                        Score pronunciation attempt
                      </button>
                    </form>
                    {pronunciationFeedback ? (
                      <div className="mt-5 rounded-[1.4rem] border border-line/80 bg-panel-strong p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xl font-bold">
                            Score {formatScore(pronunciationFeedback.overallScore)}
                          </p>
                          <p className="text-sm font-semibold text-success">
                            {pronunciationFeedback.celebrate}
                          </p>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <DimensionBar label="Segmental" value={pronunciationFeedback.segmentalScore} />
                          <DimensionBar label="Stress" value={pronunciationFeedback.stressScore} />
                          <DimensionBar label="Softness" value={pronunciationFeedback.softnessScore} />
                          <DimensionBar label="Rhythm" value={pronunciationFeedback.rhythmScore} />
                        </div>
                        <div className="mt-4 space-y-2 text-sm leading-6 text-ink-soft">
                          {pronunciationFeedback.feedback.map((item) => (
                            <p key={item}>• {item}</p>
                          ))}
                          <p className="font-semibold text-foreground">
                            Next drill: {pronunciationFeedback.nextDrill}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <section id="chunk-forge" className="glass-panel rounded-[2rem] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Module 02
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Chunk Forge</h2>
                </div>
                <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                  <Languages className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mission.focusChunks.map((chunk) => (
                  <article
                    key={chunk.id}
                    className="rounded-[1.5rem] border border-line/80 bg-white/75 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-bold">{chunk.russian}</p>
                        <p className="mt-1 text-sm text-ink-soft">{chunk.translation}</p>
                      </div>
                      <SpeakButton text={chunk.russian} />
                    </div>
                    <p className="mt-3 text-xs font-mono text-ink-soft">{chunk.stressHint}</p>
                    <p className="mt-3 text-sm leading-6 text-ink-soft">{chunk.notes}</p>
                  </article>
                ))}
              </div>
              {activeReview ? (
                <div className="mt-6 rounded-[1.6rem] border border-line/80 bg-accent/6 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Mission review card {reviewIndex + 1}/{mission.reviewQueue.length}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{activeReview.prompt}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{activeReview.cue}</p>
                  <p className="mt-3 rounded-full border border-line/80 bg-white/80 px-4 py-2 text-sm font-semibold text-foreground">
                    Answer: {activeReview.answer}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ReviewButton outcome="again" onClick={() => handleReviewGrade("again")} />
                    <ReviewButton outcome="hard" onClick={() => handleReviewGrade("hard")} />
                    <ReviewButton outcome="good" onClick={() => handleReviewGrade("good")} />
                    <ReviewButton outcome="easy" onClick={() => handleReviewGrade("easy")} />
                  </div>
                </div>
              ) : null}
            </section>
            <section id="input-theater" className="glass-panel rounded-[2rem] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Module 03
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Input Theater</h2>
                </div>
                <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                  <AudioLines className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.6rem] border border-line/80 bg-white/75 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Clip</p>
                  <h3 className="mt-2 text-3xl font-bold">{mission.inputClip.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">{mission.inputClip.context}</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">{mission.inputClip.instructions}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleMissionEvent("listen-pass", 6)}
                      className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
                    >
                      Log audio-first pass
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!transcriptRevealed) {
                          setTranscriptRevealed(true);
                          handleMissionEvent("reveal-transcript", 1);
                        }
                      }}
                      className="rounded-full border border-line/80 bg-white/80 px-5 py-3 text-sm font-bold text-foreground transition hover:border-accent hover:text-accent"
                    >
                      Reveal captions
                    </button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {mission.inputClip.comprehensionChecks.map((item) => (
                      <div key={item} className="rounded-[1.2rem] border border-line/70 bg-panel-strong px-4 py-3 text-sm text-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-line/80 bg-white/75 p-5">
                  {!transcriptRevealed ? (
                    <div className="rounded-[1.4rem] border border-dashed border-line/80 bg-panel-strong p-6">
                      <p className="text-2xl font-bold">Audio first.</p>
                      <p className="mt-3 text-sm leading-7 text-ink-soft">
                        Resist the urge to read. Attempt the clip, make a guess, then reveal only what you need.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mission.inputClip.captions.map((caption) => (
                        <article key={caption.russian} className="rounded-[1.4rem] border border-line/70 bg-panel-strong p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xl font-bold">{caption.russian}</p>
                              <p className="mt-2 text-sm text-ink-soft">{caption.translation}</p>
                            </div>
                            <SpeakButton text={caption.russian} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {caption.glosses.map((gloss) => (
                              <span key={gloss} className="rounded-full border border-line/70 bg-white px-3 py-1 text-xs text-foreground">
                                {gloss}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section id="conversation-dojo" className="glass-panel rounded-[2rem] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Module 04
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Conversation Dojo</h2>
                </div>
                <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                  <MessageSquareMore className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-[1.6rem] border border-line/80 bg-white/75 p-5">
                  <p className="text-sm leading-7 text-ink-soft">{mission.scenario.setting}</p>
                  <p className="mt-3 rounded-[1.2rem] bg-accent/8 px-4 py-3 text-sm font-semibold text-foreground">
                    Objective: {mission.scenario.objective}
                  </p>
                  <div className="mt-4 space-y-3">
                    {dialogueFeed.map((entry) => (
                      <article
                        key={entry.id}
                        className={cn(
                          "rounded-[1.4rem] p-4",
                          entry.role === "learner"
                            ? "ml-auto max-w-[85%] bg-accent text-white"
                            : "max-w-[90%] border border-line/80 bg-panel-strong",
                        )}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em]">{entry.role}</p>
                        <p className="mt-2 text-base leading-7">{entry.text}</p>
                        {entry.translation ? (
                          <p className={cn("mt-2 text-sm", entry.role === "learner" ? "text-white/80" : "text-ink-soft")}>
                            {entry.translation}
                          </p>
                        ) : null}
                        {entry.feedback?.length ? (
                          <div className="mt-3 space-y-1 text-sm text-ink-soft">
                            {entry.feedback.map((item) => (
                              <p key={item}>• {item}</p>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-line/80 bg-white/75 p-5">
                  <div className="space-y-3 text-sm leading-7">
                    <div className="rounded-[1.2rem] border border-line/80 bg-panel-strong p-4">{mission.scenario.openingPrompt}</div>
                    <div className="rounded-[1.2rem] border border-line/80 bg-panel-strong p-4">{mission.scenario.supportPrompt}</div>
                    <div className="rounded-[1.2rem] border border-line/80 bg-panel-strong p-4">{mission.scenario.stretchPrompt}</div>
                  </div>
                  <form onSubmit={handleDialogueSubmit} className="mt-5 space-y-4">
                    <textarea
                      value={dialogueInput}
                      onChange={(event) => setDialogueInput(event.target.value)}
                      rows={5}
                      placeholder="Type the learner turn in Russian..."
                      className="w-full rounded-[1.4rem] border border-line/80 bg-white px-4 py-4 outline-none transition focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep disabled:opacity-60"
                    >
                      Send turn to coach
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section id="mission-review" className="glass-panel rounded-[2rem] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Module 05
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Mission Review</h2>
                </div>
                <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                  <NotebookPen className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-5">
                <DimensionBar label="Recall" value={progress.dimensions.recall} />
                <DimensionBar label="Listening" value={progress.dimensions.listening} />
                <DimensionBar label="Pronunciation" value={progress.dimensions.pronunciation} />
                <DimensionBar label="Reading" value={progress.dimensions.reading} />
                <DimensionBar label="Speaking automaticity" value={progress.dimensions.speakingAutomaticity} />
                <DimensionBar label="Confidence" value={progress.dimensions.confidence} />
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-[1.3rem] border border-line/80 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      Transcript reveal rate
                    </span>
                    <span className="font-mono text-sm">{formatPercent(progress.transcriptRevealRate)}</span>
                  </div>
                </div>
                <div className="rounded-[1.3rem] border border-line/80 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Target className="h-4 w-4 text-accent" />
                      Speaking minutes
                    </span>
                    <span className="font-mono text-sm">{progress.speakingMinutes}</span>
                  </div>
                </div>
                <div className="rounded-[1.3rem] border border-line/80 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      Checkpoint pass rate
                    </span>
                    <span className="font-mono text-sm">{formatPercent(progress.checkpointPassRate)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-[1.5rem] border border-line/80 bg-panel-strong p-4">
                <p className="text-sm leading-7 text-foreground">{mission.reflectionPrompt}</p>
                <button
                  type="button"
                  onClick={() => handleMissionEvent("reflection-complete", 4, { week: mission.week })}
                  className="mt-4 rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                >
                  Log reflection complete
                </button>
              </div>
              {checkpoint ? (
                <div className="mt-6 rounded-[1.5rem] border border-line/80 bg-white/80 p-4">
                  <p className="text-xl font-bold text-foreground">
                    Latest checkpoint: {checkpoint.passed ? "Pass" : "Hold"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ink-soft">{checkpoint.note}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DimensionBar label="Speaking" value={checkpoint.speakingScore} />
                    <DimensionBar label="Listening" value={checkpoint.listeningScore} />
                    <DimensionBar label="Recall" value={checkpoint.recallScore} />
                    <DimensionBar label="Confidence" value={checkpoint.confidenceScore} />
                  </div>
                </div>
              ) : null}
            </section>

            <section className="glass-panel rounded-[2rem] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Evidence
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Research anchors</h2>
                </div>
                <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                  <BrainCircuit className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-4">
                {dashboard.researchAnchors.map((anchor) => (
                  <article key={anchor.id} className="rounded-[1.4rem] border border-line/80 bg-white/75 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-foreground">{anchor.title}</p>
                        <p className="mt-2 text-sm leading-7 text-ink-soft">{anchor.finding}</p>
                      </div>
                      <Sparkles className="mt-1 h-4 w-4 text-accent" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-foreground">
                      Product implication: {anchor.implication}
                    </p>
                    <a href={anchor.citationUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-deep">
                      {anchor.citationLabel}
                    </a>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
        <section className="glass-panel mt-6 rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                Roadmap
              </p>
              <h2 className="mt-2 text-3xl font-bold">Eight weeks, one coherent stack.</h2>
            </div>
            <div className="rounded-full border border-line/80 bg-white/75 px-4 py-2 text-sm font-semibold text-foreground">
              Weeks unlocked: {progress.weeksUnlocked}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.roadmap.map((week) => (
              <article
                key={week.week}
                className={cn(
                  "rounded-[1.5rem] border p-4",
                  week.week === mission.week
                    ? "border-accent bg-accent/8"
                    : "border-line/80 bg-white/75",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xl font-bold">Week {week.week}</p>
                  {week.week === mission.week ? (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      live
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{week.theme}</p>
                <p className="mt-2 text-sm leading-7 text-ink-soft">{week.objective}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-soft">
          <p className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-accent" />
            Adaptive mission engine prioritizes weak-but-ready chunks instead of static lesson order.
          </p>
          <p className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            {isPending ? "Syncing learner state..." : "State persists across restarts with local libSQL by default."}
          </p>
        </footer>
      </div>
    </main>
  );
}
