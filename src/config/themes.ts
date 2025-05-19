// Color palette with primary blue and semantic fixed colors
export const colorPalette = {
  // Primary colors
  primary: {
    main: '#2C7BE5', // Main blue color (preserved)
    light: '#EFF5FD', // Light calming background
    dark: '#4484B2', // Dark blue for contrast
  },
  // Secondary colors
  secondary: {
    main: '#00B4A6', // Teal/turquoise - more vibrant than gray
    light: '#E0F7F5', // Light teal for backgrounds
    dark: '#007A6E', // Dark teal for contrast
  },
  // Gradient transition colors between primary and secondary
  gradient: {
    red: '#E5363F', // Red from logo gradient
    redPurple: '#D94461', // Mid gradient point
    purple: '#CE5283', // Violet red
    purpleLight: '#C255DF', // Light purple
  },
  // Neutral colors
  neutral: {
    main: '#212529', // Dark for text
    light: '#ADB5BD', // Medium gray
    lighter: '#f2f4f5', // Very light gray
    white: '#FFFFFF',
    background: '#F8F9FA', // Light background
  },
  // Feedback colors
  feedback: {
    success: '#6DD39A', // Unchanged green
    warning: '#FFC107', // Yellow/orange for warnings
    error: '#E5363F', // Red from logo gradient
    info: '#2C7BE5', // Main blue for info
    labWarning: '#CE5283', // Purple warning for lab values
  },
};

// Generate opacity variants for colors
export const generateAlpha = (hexColor: string, opacity: number): string => {
  // Ensure opacity is between 0 and 1
  const validOpacity = Math.min(1, Math.max(0, opacity));
  // Convert opacity to hex
  const alpha = Math.round(validOpacity * 255).toString(16).padStart(2, '0');
  // Return hex color with alpha
  return `${hexColor}${alpha}`;
};

// Theme configuration
export const theme = {
  colors: {
    primary: colorPalette.primary.main,
    secondary: colorPalette.secondary.main,
    background: colorPalette.neutral.background,
    surface: colorPalette.neutral.white,
    text: colorPalette.neutral.main,
    disabled: colorPalette.neutral.light,
    placeholder: colorPalette.neutral.light,
    backdrop: generateAlpha(colorPalette.neutral.main, 0.5),
    notification: colorPalette.feedback.error,
    error: colorPalette.feedback.error,
  },
  // Button styles
  buttons: {
    primary: {
      backgroundColor: colorPalette.primary.main,
      textColor: colorPalette.neutral.white,
      shadowColor: generateAlpha(colorPalette.primary.main, 0.2),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    secondary: {
      backgroundColor: colorPalette.secondary.main,
      textColor: colorPalette.neutral.white,
      borderColor: colorPalette.secondary.dark,
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: colorPalette.primary.main,
      borderColor: colorPalette.primary.main,
    },
    disabled: {
      backgroundColor: colorPalette.neutral.lighter,
      textColor: colorPalette.neutral.light,
    },
    success: {
      backgroundColor: colorPalette.feedback.success,
      textColor: colorPalette.neutral.white,
    },
    danger: {
      backgroundColor: colorPalette.feedback.error,
      textColor: colorPalette.neutral.white,
    },
    info: {
      backgroundColor: colorPalette.primary.main,
      textColor: colorPalette.neutral.white,
    },
    fab: {
      backgroundColor: colorPalette.primary.main,
      textColor: colorPalette.neutral.white,
      elevation: 6,
      shadowColor: colorPalette.primary.main,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  },
  // Chart styles
  chart: {
    line: {
      color: colorPalette.primary.main,
      width: 3,
    },
    point: {
      normal: {
        fill: colorPalette.primary.main,
        stroke: colorPalette.neutral.white,
        strokeWidth: 1,
        radius: 4,
      },
      alert: {
        fill: colorPalette.feedback.error,
        stroke: colorPalette.neutral.white,
        strokeWidth: 1,
        radius: 4,
      },
    },
    referenceArea: {
      fill: colorPalette.feedback.success,
      stroke: colorPalette.feedback.success,
      strokeWidth: 1,
      opacity: 0.6,
      gradient: {
        start: {
          color: colorPalette.feedback.success,
          opacity: 0.4,
        },
        end: {
          color: colorPalette.feedback.success,
          opacity: 0.05,
        },
      },
    },
    grid: {
      line: {
        color: colorPalette.neutral.lighter,
        width: 1,
      },
      text: {
        color: colorPalette.neutral.light,
        fontSize: 9,
      },
    },
    stats: {
      card: {
        backgroundColor: colorPalette.neutral.white,
        alert: {
          backgroundColor: generateAlpha(colorPalette.feedback.error, 0.1),
        },
      },
      label: {
        color: colorPalette.neutral.light,
        fontSize: 12,
      },
      value: {
        normal: {
          color: colorPalette.feedback.info,
          fontSize: 16,
        },
        alert: {
          color: colorPalette.feedback.error,
          fontSize: 16,
        },
      },
      date: {
        color: colorPalette.neutral.light,
        fontSize: 10,
      },
    },
  },
};

export default theme; 