// Headspace-inspired design tokens for family experience only
export const familyTheme = {
  colors: {
    // Headspace-inspired palette
    primary: {
      50: '#f0f7ff',
      100: '#e0efff', 
      500: '#0061EF',
      600: '#0056d6',
      700: '#004bb3',
      900: '#003d99'
    },
    camino: {
      warm: '#FF6B35',     // Sunset orange
      earth: '#8B5A3C',    // Path brown  
      sage: '#87A96B',     // Nature green
      sky: '#A8DADC',      // Horizon blue
      cream: '#FFF8F0'     // Warm background
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      500: '#737373',
      700: '#404040',
      900: '#171717'
    }
  },
  
  typography: {
    // Headspace-inspired font system
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif']
    },
    fontSize: {
      'display-lg': ['3rem', { lineHeight: '1.1' }],
      'display': ['2.5rem', { lineHeight: '1.2' }],
      'h1': ['2rem', { lineHeight: '1.3' }],
      'h2': ['1.5rem', { lineHeight: '1.4' }],
      'body-lg': ['1.125rem', { lineHeight: '1.6' }],
      'body': ['1rem', { lineHeight: '1.6' }],
      'caption': ['0.875rem', { lineHeight: '1.5' }],
      'small': ['0.75rem', { lineHeight: '1.4' }]
    }
  },
  
  spacing: {
    // Systematic spacing scale
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
    '2xl': '64px'
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
}

// Utility to generate CSS custom properties
export function generateFamilyThemeCSS() {
  return `
    /* Family-only theme variables */
    .family-theme {
      --family-primary-50: ${familyTheme.colors.primary[50]};
      --family-primary-500: ${familyTheme.colors.primary[500]};
      --family-primary-600: ${familyTheme.colors.primary[600]};
      --family-warm: ${familyTheme.colors.camino.warm};
      --family-earth: ${familyTheme.colors.camino.earth};
      --family-sage: ${familyTheme.colors.camino.sage};
      --family-sky: ${familyTheme.colors.camino.sky};
      --family-cream: ${familyTheme.colors.camino.cream};
      --family-spacing-sm: ${familyTheme.spacing.sm};
      --family-spacing-md: ${familyTheme.spacing.md};
      --family-spacing-lg: ${familyTheme.spacing.lg};
      --family-radius-md: ${familyTheme.borderRadius.md};
      --family-radius-lg: ${familyTheme.borderRadius.lg};
    }
  `
}