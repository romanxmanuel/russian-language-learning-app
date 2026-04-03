export const MASTERY_DIMENSIONS = [
  "recall",
  "listening",
  "pronunciation",
  "reading",
  "speakingAutomaticity",
  "confidence",
] as const;

export type MasteryDimension = (typeof MASTERY_DIMENSIONS)[number];

export type ChunkTag =
  | "survival"
  | "pronunciation"
  | "movement"
  | "food"
  | "time"
  | "social"
  | "aspect"
  | "cases";

export type ModuleKey =
  | "pronunciation"
  | "chunks"
  | "input"
  | "conversation"
  | "review";

export type MissionEventType =
  | "session-start"
  | "listen-pass"
  | "reveal-transcript"
  | "review-complete"
  | "dialogue-turn"
  | "pronunciation-attempt"
  | "reflection-complete"
  | "checkpoint";

export type ReviewOutcome = "again" | "hard" | "good" | "easy";

export interface UserProfile {
  id: string;
  name: string;
  nativeLanguage: string;
  targetLanguage: string;
  dailyMinutes: number;
  motivation: string;
  timezone: string;
  startedAt: string;
  updatedAt: string;
}

export interface LexicalChunk {
  id: string;
  week: number;
  title: string;
  russian: string;
  transliteration: string;
  translation: string;
  notes: string;
  stressHint: string;
  functions: string[];
  tags: ChunkTag[];
  difficulty: number;
  keywords: string[];
}

export interface SkillNode {
  id: string;
  week: number;
  title: string;
  description: string;
  focus: ModuleKey;
  chunkIds: string[];
}

export interface ReviewItem {
  id: string;
  chunkId: string;
  prompt: string;
  answer: string;
  cue: string;
}

export interface CaptionLine {
  russian: string;
  translation: string;
  glosses: string[];
}

export interface InputClip {
  id: string;
  week: number;
  title: string;
  context: string;
  instructions: string;
  captions: CaptionLine[];
  comprehensionChecks: string[];
}

export interface DialogueLine {
  speaker: "coach" | "local";
  russian: string;
  translation: string;
}

export interface DialogueScenario {
  id: string;
  week: number;
  title: string;
  setting: string;
  objective: string;
  targetChunkIds: string[];
  openingPrompt: string;
  supportPrompt: string;
  stretchPrompt: string;
  sampleLines: DialogueLine[];
}

export interface WeekProgram {
  week: number;
  slug: string;
  theme: string;
  missionName: string;
  objective: string;
  milestone: string;
  grammarFrame: string;
  pronunciationNote: string;
  experiments: string[];
  skillNodes: SkillNode[];
  chunks: LexicalChunk[];
  reviewItems: ReviewItem[];
  inputClip: InputClip;
  scenario: DialogueScenario;
  reflectionPrompt: string;
}

export interface MasteryState {
  userId: string;
  chunkId: string;
  recall: number;
  listening: number;
  pronunciation: number;
  reading: number;
  speakingAutomaticity: number;
  confidence: number;
  strength: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  seenCount: number;
  introducedWeek: number;
}

export interface MissionStep {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface MissionPlan {
  date: string;
  week: number;
  theme: string;
  missionName: string;
  objective: string;
  grammarFrame: string;
  flow: MissionStep[];
  focusChunks: LexicalChunk[];
  pronunciationFocus: LexicalChunk[];
  reviewQueue: ReviewItem[];
  dueWeakSpots: LexicalChunk[];
  scenario: DialogueScenario;
  inputClip: InputClip;
  experiments: string[];
  reflectionPrompt: string;
  readinessScore: number;
  coachNote: string;
}

export interface ReviewGradeInput {
  chunkId: string;
  outcome: ReviewOutcome;
  accuracy?: number;
  confidence?: number;
  minutesSpent?: number;
}

export interface MissionEventInput {
  eventType: MissionEventType;
  minutesSpent?: number;
  payload?: Record<string, unknown>;
}

export interface PronunciationAttemptInput {
  chunkId?: string;
  targetText: string;
  attemptText: string;
}

export interface PronunciationFeedback {
  id: string;
  chunkId?: string;
  targetText: string;
  attemptText: string;
  overallScore: number;
  segmentalScore: number;
  stressScore: number;
  softnessScore: number;
  rhythmScore: number;
  celebrate: string;
  feedback: string[];
  nextDrill: string;
  createdAt: string;
}

export interface DialogueTurnInput {
  scenarioId: string;
  userTurn: string;
}

export interface DialogueResponse {
  scenarioId: string;
  coachReply: string;
  coachTranslation: string;
  recast: string;
  feedback: string[];
  nextPrompt: string;
  masteryBoostIds: string[];
}

export interface CheckpointResult {
  id: string;
  week: number;
  speakingScore: number;
  listeningScore: number;
  recallScore: number;
  confidenceScore: number;
  overallScore: number;
  passed: boolean;
  note: string;
  createdAt: string;
}

export interface ProgressSnapshot {
  dimensions: Record<MasteryDimension, number>;
  totalMinutes: number;
  speakingMinutes: number;
  transcriptRevealRate: number;
  pronunciationTrend: number[];
  retention: {
    day1: number | null;
    day3: number | null;
    day7: number | null;
    day14: number | null;
  };
  checkpointPassRate: number;
  missionStreak: number;
  weeksUnlocked: number;
  recentWins: string[];
}

export interface WeekRoadmap {
  week: number;
  theme: string;
  missionName: string;
  objective: string;
  milestone: string;
}

export interface ResearchAnchor {
  id: string;
  title: string;
  finding: string;
  implication: string;
  citationLabel: string;
  citationUrl: string;
}

export interface DashboardSnapshot {
  profile: UserProfile | null;
  mission: MissionPlan;
  progress: ProgressSnapshot;
  roadmap: WeekRoadmap[];
  researchAnchors: ResearchAnchor[];
  isPreview: boolean;
  lastCheckpoint: CheckpointResult | null;
}
