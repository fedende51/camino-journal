export const spacing = {
  // Base spacing scale - powers of 2 for consistency
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',      // Base unit
  5: '20px',
  6: '24px',      // Primary spacing unit
  7: '28px',
  8: '32px',      // Secondary spacing unit
  9: '36px',
  10: '40px',
  11: '44px',     // Minimum touch target
  12: '48px',     // Tertiary spacing unit
  14: '56px',
  16: '64px',     // Large spacing unit
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px'
}

// Semantic spacing tokens for common use cases
export const semanticSpacing = {
  // Content spacing
  contentGap: {
    xs: spacing[2],    // 8px - tight content
    sm: spacing[4],    // 16px - standard content gap
    md: spacing[6],    // 24px - section gap
    lg: spacing[8],    // 32px - major section gap
    xl: spacing[12],   // 48px - page section gap
    xxl: spacing[16]   // 64px - hero section gap
  },

  // Component spacing
  component: {
    paddingX: {
      sm: spacing[3],  // 12px - small component padding
      md: spacing[4],  // 16px - standard component padding
      lg: spacing[6],  // 24px - large component padding
      xl: spacing[8]   // 32px - extra large component padding
    },
    paddingY: {
      sm: spacing[2],  // 8px - small component padding
      md: spacing[3],  // 12px - standard component padding  
      lg: spacing[4],  // 16px - large component padding
      xl: spacing[6]   // 24px - extra large component padding
    }
  },

  // Layout spacing
  layout: {
    containerPadding: {
      mobile: spacing[4],   // 16px - mobile container padding
      tablet: spacing[6],   // 24px - tablet container padding
      desktop: spacing[8]   // 32px - desktop container padding
    },
    sectionGap: {
      sm: spacing[8],       // 32px - small section gap
      md: spacing[12],      // 48px - medium section gap
      lg: spacing[16],      // 64px - large section gap
      xl: spacing[20]       // 80px - extra large section gap
    }
  },

  // Interactive element spacing
  interactive: {
    touchTarget: spacing[11],     // 44px - minimum touch target
    buttonPadding: {
      sm: `${spacing[2]} ${spacing[3]}`,     // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`,     // 12px 16px
      lg: `${spacing[4]} ${spacing[6]}`,     // 16px 24px
      xl: `${spacing[5]} ${spacing[8]}`      // 20px 32px
    },
    inputPadding: {
      sm: `${spacing[2]} ${spacing[3]}`,     // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`,     // 12px 16px
      lg: `${spacing[4]} ${spacing[5]}`      // 16px 20px
    }
  }
}

// Border radius system
export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',      // Standard border radius
  lg: '12px',     // Card border radius
  xl: '16px',     // Large component border radius
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px'  // Fully rounded (pills, avatars)
}

// Shadow system for elevation
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
}