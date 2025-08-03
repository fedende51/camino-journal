export const colors = {
  // Primary Headspace-inspired blues
  primary: {
    50: '#f0f7ff',
    100: '#e0efff', 
    200: '#baddff',
    300: '#7dc3ff',
    400: '#36a5ff',
    500: '#0061EF', // Main Headspace blue
    600: '#0052d1',
    700: '#0043a8',
    800: '#00378a',
    900: '#003d99',
    950: '#002661'
  },

  // Camino-themed earth tones
  camino: {
    warm: '#FF6B35',      // Sunset orange
    earth: '#8B5A3C',     // Path brown  
    sage: '#87A96B',      // Nature green
    sky: '#A8DADC',       // Horizon blue
    stone: '#C7B99C',     // Stone beige
    mist: '#F5F5DC'       // Morning mist
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },

  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },

  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },

  // Neutral grays
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  }
}

// Semantic color mappings for light theme
export const lightTheme = {
  background: colors.neutral[0],
  surface: colors.neutral[50],
  surfaceElevated: colors.neutral[0],
  border: colors.neutral[200],
  borderSubtle: colors.neutral[100],
  
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    inverse: colors.neutral[0]
  },

  interactive: {
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryActive: colors.primary[700],
    secondary: colors.neutral[100],
    secondaryHover: colors.neutral[200],
    ghost: 'transparent',
    ghostHover: colors.neutral[50]
  }
}

// Semantic color mappings for dark theme
export const darkTheme = {
  background: colors.neutral[950],
  surface: colors.neutral[900],
  surfaceElevated: colors.neutral[800],
  border: colors.neutral[700],
  borderSubtle: colors.neutral[800],
  
  text: {
    primary: colors.neutral[50],
    secondary: colors.neutral[300],
    tertiary: colors.neutral[400],
    inverse: colors.neutral[900]
  },

  interactive: {
    primary: colors.primary[500],
    primaryHover: colors.primary[400],
    primaryActive: colors.primary[300],
    secondary: colors.neutral[800],
    secondaryHover: colors.neutral[700],
    ghost: 'transparent',
    ghostHover: colors.neutral[800]
  }
}