// The shape every palette must satisfy.
// No raw values here — only the type definition.

export interface ColorPalette {
  // ─── Backgrounds ──────────────────────────────────────────────────────────
  background: string;

  // ─── Gradients ────────────────────────────────────────────────────────────
  gradients: {
    card: readonly [string, string];
  };

  // ─── Brand ────────────────────────────────────────────────────────────────
  primary: string;
  secondary: string;

  // ─── Semantic status ──────────────────────────────────────────────────────
  success: string;
  warning: string;
  error: string;
  info: string;

  // ─── Metrics ──────────────────────────────────────────────────────────────
  strain: string;
  recovery: string;
  sleep: string;
  steps: string;
  calories: string;
  active: string;
  skinTemp: string;

  // ─── Sleep stages ─────────────────────────────────────────────────────────
  sleepStages: { rem: string; deep: string; light: string };

  // ─── HR zones (Z1–Z5) ─────────────────────────────────────────────────────
  zones: readonly [string, string, string, string, string];

  // ─── Gauge scales ─────────────────────────────────────────────────────────
  gaugeColors: {
    vo2Max: readonly [string, string, string, string];
    trainingLoad: readonly [string, string, string, string];
    recovery: readonly [string, string, string];
    hrv: readonly [string, string, string];
  };

  // ─── Recovery semantic ────────────────────────────────────────────────────
  recoveryColors: { low: string; medium: string; high: string };

  // ─── Stress timeline ──────────────────────────────────────────────────────
  stress: {
    calm: string;
    low: string;
    mild: string;
    moderate: string;
    high: string;
    activity: string;
  };

  // ─── Training load ────────────────────────────────────────────────────────
  trainingLoad: {
    recovery: string;
    maintaining: string;
    productive: string;
    overreaching: string;
    overtraining: string;
    detraining: string;
  };

  // ─── Text ─────────────────────────────────────────────────────────────────
  text: { primary: string; secondary: string; tertiary: string; muted: string };

  // ─── Icons ────────────────────────────────────────────────────────────────
  icon: { onLight: string; onDark: string };

  // ─── Switch thumb ─────────────────────────────────────────────────────────
  thumb: string;

  // ─── Overlays ─────────────────────────────────────────────────────────────
  overlay: {
    ghost: string;
    dim: string;
    muted: string;
    soft: string;
    faint: string;
    light: string;
    medium: string;
    warm: string;
    stroke: string;
    label: string;
    strong: string;
    dark: string;
  };

  // ─── Borders ──────────────────────────────────────────────────────────────
  border: {
    faint: string;
    subtle: string;
    medium: string;
    default: string;
    strong: string;
    sleep: { faint: string; light: string; medium: string; strong: string };
    error: string;
    warning: string;
    success: string;
  };

  // ─── Logo variant ─────────────────────────────────────────────────────────
  // Which in-app logo asset to use: 'light' = white logo, 'dark' = black logo.
  logoVariant: 'light' | 'dark';

  // ─── Preview swatch ───────────────────────────────────────────────────────
  // Two colors shown in the split-circle theme picker preview.
  previewSwatch: readonly [string, string];

  // ─── Bluetooth ────────────────────────────────────────────────────────────
  // Always a recognisable Bluetooth blue regardless of primary accent.
  bluetooth: string;

  // ─── Shadow ───────────────────────────────────────────────────────────────
  shadow: string;

  // ─── Surfaces ─────────────────────────────────────────────────────────────
  surface: {
    card: string;
    sheet: string;
    tooltipDark: string;
    tooltipDeep: string;
    tooltipDeepHigh: string;
    tabBar: string;
    banner: string;
  };

  // ─── Scrim ────────────────────────────────────────────────────────────────
  scrim: { medium: string; dark: string };

  // ─── Icon tints ───────────────────────────────────────────────────────────
  iconTint: {
    steps: string;
    purple: string;
    primary: string;
    sleep: string;
    strain: string;
    recovery: string;
    active: string;
    warning: string;
    skinTemp: string;
  };
}
