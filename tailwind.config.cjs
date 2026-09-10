/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./painel-jb-2026.html",
    "./src/**/*.{js,jsx,mjs,cjs,ts,tsx}",
  ],
  theme: {
    extend: {
      // Imagem do header no estilo Aluroni (public/assets/header.png)
      backgroundImage: {
        header: "url('/assets/header.png')",
      },
      // Breakpoints no estilo Aluroni
      screens: {
        tablet: "768px",
        desktop_md: "980px",
        desktop_lg: "1080px",
        desktop_xl: "1280px",
      },
      fontFamily: {
        italiana: ["Italiana", "serif"],
        josefinSans: ["JosefinSans", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      colors: {
        dark: "#242536",
        darkGray: "#92929d",
        darkestGray: "#70707b",
        gray: "#e4e4e4",
        black: "#4c4d5e",
        lightGray: "#f6f6f6",
        blue: "#282b57",
        red: "#d73b3b",
        redDark: "#c62a2a",
        massas: "#d73b3b",
        carnes: "#30201e",
        combos: "#e6c864",
        veganos: "#80aa40",
      },
    },
  },
  plugins: [],
};
