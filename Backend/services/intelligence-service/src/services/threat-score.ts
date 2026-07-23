/**
 * Threat Score Algorithm
 * =======================
 * Menghitung skor numerik 0-100 untuk setiap ancaman berdasarkan
 * multiple signals dengan weighted average + time decay + context boost.
 *
 * Signals:
 *   - CVSS Score           (25%) — Tingkat keparahan teknis
 *   - Exploit Status       (25%) — Ketersediaan exploit (POC/Weaponized/Active)
 *   - Dark Web Chatter     (10%) — Mentions di dark web / forum
 *   - Threat Actor Activity(15%) — Keterkaitan dengan aktor aktif
 *   - Recency              (15%) — Waktu sejak publikasi/deteksi
 *   - Asset Context        (10%) — Criticality aset terdampak
 */

import type {
  IThreatScoreSignals,
  IScoreBreakdown,
  ScoreLevel,
  RecommendedAction,
  Confidence,
  IThreatScore,
} from '../models/ThreatScore';

// ──────────────────────────────────────
//  Constants
// ──────────────────────────────────────

const WEIGHTS = {
  cvss:          0.25,
  exploit:       0.25,
  darkWeb:       0.10,
  actorActivity: 0.15,
  recency:       0.15,
  context:       0.10,
};

const LEVEL_THRESHOLDS = [
  { min: 75, level: 'CRITICAL' as ScoreLevel },
  { min: 50, level: 'HIGH' as ScoreLevel },
  { min: 25, level: 'MEDIUM' as ScoreLevel },
  { min: 0,  level: 'LOW' as ScoreLevel },
];

const ACTION_THRESHOLDS = [
  { min: 85, action: 'IMMEDIATE' as RecommendedAction },
  { min: 65, action: 'ESCALATE' as RecommendedAction },
  { min: 40, action: 'PATCH' as RecommendedAction },
  { min: 20, action: 'REVIEW' as RecommendedAction },
  { min: 0,  action: 'MONITOR' as RecommendedAction },
];

// ──────────────────────────────────────
//  Score Result
// ──────────────────────────────────────

export interface ThreatScoreResult {
  score: number;
  level: ScoreLevel;
  confidence: Confidence;
  breakdown: IScoreBreakdown;
  recommendedAction: RecommendedAction;
  recommendedActionReason: string;
}

// ──────────────────────────────────────
//  Normalizers (semua input → 0–100)
// ──────────────────────────────────────

function normalizeCvss(cvss: number): number {
  return Math.min(100, Math.max(0, Math.round((cvss / 10) * 100)));
}

function exploitMaturityScore(maturity: string): number {
  const map: Record<string, number> = {
    NONE: 0,
    POC: 40,
    WEAPONIZED: 75,
    ACTIVE: 100,
  };
  return map[maturity] ?? 0;
}

function exploitAvailableScore(available: boolean, maturityScore: number): number {
  if (!available) return 0;
  return maturityScore > 0 ? maturityScore : 50;
}

function recencyScore(daysSincePublished: number): number {
  if (daysSincePublished <= 7)   return 100;
  if (daysSincePublished <= 30)  return 70;
  if (daysSincePublished <= 90)  return 40;
  if (daysSincePublished <= 365) return 15;
  return 5;
}

function mentionScore(count: number): number {
  return Math.min(100, Math.round(count * 1.5));
}

function actorActivityScore(activity: string): number {
  const map: Record<string, number> = { LOW: 10, MEDIUM: 50, HIGH: 90 };
  return map[activity] ?? 10;
}

function criticalityScore(criticality: string): number {
  const map: Record<string, number> = { LOW: 10, MEDIUM: 35, HIGH: 65, CRITICAL: 100 };
  return map[criticality] ?? 10;
}

// ──────────────────────────────────────
//  Main Calculator
// ──────────────────────────────────────

export function calculateThreatScore(
  signals: Partial<IThreatScoreSignals>,
  options?: { confidenceOverride?: Confidence },
): ThreatScoreResult {
  // ── 1. Normalize all signals ──
  const s = {
    cvss:          normalizeCvss(signals.cvssScore ?? 0),
    exploit:       exploitAvailableScore(signals.exploitAvailable ?? false, exploitMaturityScore(signals.exploitMaturity ?? 'NONE')),
    exploitMat:    exploitMaturityScore(signals.exploitMaturity ?? 'NONE'),
    darkWeb:       mentionScore(signals.darkWebMentions ?? 0),
    actorActivity: actorActivityScore(signals.threatActorActivity ?? 'LOW'),
    recency:       recencyScore(signals.daysSincePublished ?? 999),
    criticality:   criticalityScore(signals.assetCriticality ?? 'LOW'),
  };

  // ── 2. Weighted sum ──
  const rawScore = (
    s.cvss          * WEIGHTS.cvss +
    s.exploit       * WEIGHTS.exploit +
    s.darkWeb       * WEIGHTS.darkWeb +
    s.actorActivity * WEIGHTS.actorActivity +
    s.recency       * WEIGHTS.recency +
    s.criticality   * WEIGHTS.context
  );

  // ── 3. Boosts (multiplicative) ──
  let boost = 1.0;
  const boostReasons: string[] = [];

  if (signals.exploitMaturity === 'ACTIVE') {
    boost += 0.30;
    boostReasons.push('Active exploit in the wild');
  }
  if (signals.exploitMaturity === 'WEAPONIZED') {
    boost += 0.15;
    boostReasons.push('Weaponized exploit available');
  }
  if ((signals.darkWebMentions ?? 0) > 50) {
    boost += 0.15;
    boostReasons.push('High dark web chatter');
  }
  if ((signals.threatActorCount ?? 0) >= 3) {
    boost += 0.20;
    boostReasons.push('Multiple threat actors targeting');
  }
  if ((signals.affectedAssetsCount ?? 0) >= 10) {
    boost += 0.10;
    boostReasons.push('Widespread asset impact');
  }

  const finalScore = Math.min(100, Math.round(rawScore * boost));

  // ── 4. Determine level ──
  const level = LEVEL_THRESHOLDS.find(t => finalScore >= t.min)?.level ?? 'LOW';

  // ── 5. Determine recommended action ──
  const action = ACTION_THRESHOLDS.find(t => finalScore >= t.min)?.action ?? 'MONITOR';

  // ── 6. Build reason string ──
  const reasonParts: string[] = [`Score ${finalScore}/100 (${level})`];
  if (boostReasons.length > 0) {
    reasonParts.push(...boostReasons);
  }
  if (signals.cvssScore && signals.cvssScore > 7) {
    reasonParts.push(`CVSS ${signals.cvssScore}`);
  }

  // ── 7. Confidence ──
  const confidence: Confidence =
    options?.confidenceOverride ??
    (signals.cvssScore && signals.daysSincePublished !== undefined ? 'HIGH' :
     signals.exploitAvailable !== undefined ? 'MEDIUM' : 'LOW');

  // ── 8. Breakdown ──
  const breakdown: IScoreBreakdown = {
    exploitability: Math.round(s.cvss * 0.5 + s.exploit * 0.3 + s.exploitMat * 0.2),
    impact:         Math.round(s.cvss),
    threatIntel:    Math.round(s.darkWeb * 0.4 + s.actorActivity * 0.6),
    recency:        Math.round(s.recency),
    context:        Math.round(s.criticality),
  };

  return {
    score: finalScore,
    level,
    confidence,
    breakdown,
    recommendedAction: action,
    recommendedActionReason: reasonParts.join('. '),
  };
}

// ──────────────────────────────────────
//  Batch Calculator (untuk bulk update)
// ──────────────────────────────────────

export function calculateBatch(
  items: Array<{ signals: Partial<IThreatScoreSignals>; targetType: IThreatScore['targetType']; targetId: string; targetRef: string; tenantId: string }>,
): Array<{ score: ThreatScoreResult } & typeof items[0]> {
  return items.map(item => ({
    ...item,
    score: calculateThreatScore(item.signals),
  }));
}
