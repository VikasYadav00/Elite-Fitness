/**
 * Elite Fitness — Design System / Theme Tokens
 * Premium White + Sky Blue Light Theme
 * All colors are centralized here for easy maintenance.
 */

export const COLORS = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  bgMain: '#F8FBFF',          // Very light blue-white page background
  bgCard: '#FFFFFF',          // Pure white cards
  bgCardAlt: '#F0F7FF',       // Alternate soft card background
  bgHover: '#EAF5FF',         // Hover state background
  bgSelected: '#DBEEFF',      // Selected / highlighted item

  // ── Primary Sky Blue ───────────────────────────────────────────────────────
  primary: '#4DA6FF',         // Primary buttons, active states, highlights
  primaryHover: '#2E8FE8',    // Darker blue on hover/press
  primaryLight: '#7CC6FE',    // Soft blue for secondary elements
  primaryUltraLight: '#EAF5FF', // Very light blue for tints, row highlights

  // ── Borders ────────────────────────────────────────────────────────────────
  border: '#DCEBFA',          // Soft blue-gray borders
  borderFocus: '#4DA6FF',     // Focus ring border

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#1F2937',     // Dark gray primary text
  textSecondary: '#6B7280',   // Medium gray secondary text
  textMuted: '#9CA3AF',       // Muted / placeholder text
  textOnPrimary: '#FFFFFF',   // White text on blue buttons

  // ── Status Colors ─────────────────────────────────────────────────────────
  success: '#059669',         // Emerald green
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',

  warning: '#D97706',         // Amber orange
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#DC2626',          // Red
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',

  info: '#0284C7',            // Info blue
  infoBg: '#F0F9FF',
  infoBorder: '#BAE6FD',

  frozen: '#0284C7',          // Frozen membership
  frozenBg: '#F0F9FF',
  frozenBorder: '#BAE6FD',

  // ── Gradient ──────────────────────────────────────────────────────────────
  gradientPrimary: 'linear-gradient(135deg, #4DA6FF 0%, #2E8FE8 100%)',
  gradientSoft: 'linear-gradient(135deg, #EAF5FF 0%, #F8FBFF 100%)',
  gradientHero: 'linear-gradient(135deg, #4DA6FF 0%, #0066CC 100%)',

  // ── Shadows ───────────────────────────────────────────────────────────────
  shadowCard: '0 1px 3px rgba(77, 166, 255, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowCardHover: '0 4px 12px rgba(77, 166, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.06)',
  shadowModal: '0 20px 50px rgba(77, 166, 255, 0.15), 0 10px 20px rgba(0, 0, 0, 0.08)',
  shadowHeader: '0 1px 4px rgba(77, 166, 255, 0.12)',
};

export const RADIUS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  full: '999px',
};

// Pre-built inline style objects for common patterns
export const cardStyle = {
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.lg,
  boxShadow: COLORS.shadowCard,
};

export const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: '#FFFFFF',
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.md,
  color: COLORS.textPrimary,
  fontSize: '0.92rem',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  minHeight: '44px',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

export const labelStyle = {
  display: 'block',
  fontSize: '0.74rem',
  fontWeight: 700,
  color: COLORS.textSecondary,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export const btnPrimaryStyle = {
  background: COLORS.gradientPrimary,
  color: '#FFFFFF',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 700,
  padding: '11px 18px',
  borderRadius: RADIUS.md,
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  transition: 'all 0.15s ease',
  boxShadow: '0 2px 8px rgba(77, 166, 255, 0.35)',
  minHeight: '44px',
};

export const btnSecondaryStyle = {
  background: '#FFFFFF',
  color: COLORS.primary,
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 600,
  padding: '10px 16px',
  borderRadius: RADIUS.md,
  border: `1px solid ${COLORS.primary}`,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '0.86rem',
  transition: 'all 0.15s ease',
  minHeight: '44px',
};

export const STATUS_STYLES = {
  ACTIVE: {
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    label: 'Active',
  },
  FROZEN: {
    color: '#0284C7',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    label: 'Frozen',
  },
  EXPIRED: {
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Expired',
  },
  INACTIVE: {
    color: '#6B7280',
    bg: '#F9FAFB',
    border: '#E5E7EB',
    label: 'Inactive',
  },
  PENDING: {
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Pending',
  },
  PAID: {
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    label: 'Paid',
  },
  DUE: {
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Due',
  },
};
