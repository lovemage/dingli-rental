/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            900: '#1f6f23',
            700: '#2e9d2f',
            500: '#51b65a',
            50:  '#ecf7ec',
          },
          orange: {
            700: '#e08a0a',
            500: '#f39c12',
            300: '#ffc864',
            50:  '#fff4e0',
          },
        },
        ink: {
          900: '#1a2421',
          700: '#3a4541',
          500: '#6b7570',
          300: '#b9beba',
        },
        paper: {
          DEFAULT: '#fffdf8',
          2: '#f7f3ea',
        },
        line: '#e6e1d4',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '14px',
        xl: '22px',
      },
      boxShadow: {
        sm: '0 2px 6px rgba(31, 111, 35, .06)',
        md: '0 8px 28px rgba(31, 111, 35, .10)',
        lg: '0 18px 50px rgba(31, 111, 35, .14)',
      },
    },
  },
  plugins: [],
};
