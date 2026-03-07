export async function generateTheme(input: {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
}) {
  const theme = {
    colors: {
      primary: input.primaryColor || "#3b82f6",
      secondary: input.secondaryColor || "#1f2937",
    },
    fontFamily: {
      sans: input.fontFamily || "system-ui, -apple-system, sans-serif",
    },
    borderRadius: {
      default: input.borderRadius || "0.5rem",
    },
  };

  const tailwindConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${theme.colors.primary}',
        secondary: '${theme.colors.secondary}',
      },
      fontFamily: {
        sans: ['${theme.fontFamily.sans}'],
      },
      borderRadius: {
        DEFAULT: '${theme.borderRadius.default}',
      },
    },
  },
  plugins: [],
}
  `.trim();

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        theme,
        tailwindConfig,
      }, null, 2),
    }],
  };
}
