/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cherry: {
          50:  "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d9",
          300: "#f4a8bb",
          400: "#ec7396",
          500: "#e0476f",
          600: "#cc2a52",
          700: "#ab1f42",
          800: "#8f1d3c",
          900: "#7a1d39",
          950: "#430a1a",
        },
        sage: {
          50:  "#f2f8f0",
          100: "#e0f0db",
          200: "#c2e1ba",
          300: "#97ca8e",
          400: "#66ae59",
          500: "#45913b",
          600: "#35742e",
          700: "#2c5d27",
          800: "#264a22",
          900: "#213e1e",
          950: "#0e200d",
        },
      },
    },
  },
  plugins: [],
};
