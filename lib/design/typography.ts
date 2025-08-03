export const typography = {
  fontFamily: {
    // Primary font stack - modern, readable sans-serif
    sans: [
      'Inter', 
      '-apple-system', 
      'BlinkMacSystemFont', 
      '"Segoe UI"', 
      'Roboto', 
      '"Helvetica Neue"', 
      'Arial', 
      'sans-serif'
    ],
    // Monospace for code snippets if needed
    mono: [
      '"SF Mono"',
      'Monaco',
      'Inconsolata',
      '"Roboto Mono"',
      '"Fira Code"',
      '"Fira Mono"',
      'monospace'
    ]
  },

  fontSize: {
    // Display sizes for hero sections
    'display-lg': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],      // 64px
    'display-md': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],    // 56px
    'display-sm': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],      // 48px

    // Heading hierarchy
    'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],            // 40px
    'h2': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],             // 32px
    'h3': ['1.5rem', { lineHeight: '1.4' }],                                      // 24px
    'h4': ['1.25rem', { lineHeight: '1.4' }],                                     // 20px
    'h5': ['1.125rem', { lineHeight: '1.5' }],                                    // 18px
    'h6': ['1rem', { lineHeight: '1.5' }],                                        // 16px

    // Body text
    'body-lg': ['1.125rem', { lineHeight: '1.6' }],                               // 18px
    'body': ['1rem', { lineHeight: '1.6' }],                                      // 16px
    'body-sm': ['0.875rem', { lineHeight: '1.5' }],                               // 14px

    // UI text
    'caption': ['0.75rem', { lineHeight: '1.4' }],                                // 12px
    'overline': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.1em' }],       // 12px uppercase
    'button': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],                 // 16px medium
    'button-sm': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],          // 14px medium
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },

  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0em',
    wide: '0.05em',
    wider: '0.1em'
  },

  lineHeight: {
    none: '1',
    tight: '1.1',
    snug: '1.2',
    normal: '1.3',
    relaxed: '1.4',
    loose: '1.5',
    extraLoose: '1.6'
  }
}

// Font loading configuration for better performance
export const fontConfig = {
  preload: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
      crossOrigin: 'anonymous'
    }
  ],
  
  // Font display strategy
  fontDisplay: 'swap' as const,
  
  // Fallback font while custom fonts load
  fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}