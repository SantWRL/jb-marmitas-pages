/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./painel-jb-2026.html",
    "./src/**/*.{js,jsx,mjs,cjs,ts,tsx}",
  ],
  theme: {
    extend: {
      // Breakpoints no estilo Aluroni
      screens: {
        tablet: "768px",
        desktop_md: "980px",
        desktop_lg: "1080px",
        desktop_xl: "1280px",
      },
      fontFamily: {
        italiana: ["Italiana", "serif"],
        josefinSans: ["Josefin Sans", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        feather: ["feather", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        duolingoSans: ["duolingo-sans", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        /* ===== Marca JB Marmitas: laranja e preto ===== */
        // Laranja da logo (#f79300) e variações
        primary: "#f79300",
        primaryDark: "#d97a00",
        primaryLight: "#ffb340",
        brandBlack: "#0d0d0d",
        brandInk: "#171717",
        brandGray: "#2a2a2a",

        /* ===== Tokens do @theme ===== */
        // Colors
        eagerGreen: "#58cc02",
        storybookGreen: "#d7ffb8",
        sparkBlue: "#1cb0f6",
        freshLeaf: "#a5ed6e",
        nightInk: "#000437",
        paperWhite: "#ffffff",
        charcoal: "#4b4b4b",
        pencilGray: "#777777",
        fadedGray: "#afafaf",

        /* ===== Aliases de compatibilidade (usados pelos componentes) ===== */
        dark: "#0d0d0d",
        darkGray: "#4b4b4b",
        darkestGray: "#777777",
        gray: "#ececec",
        black: "#0d0d0d",
        lightGray: "#f6f6f6",
        // "red" continua existindo, mas agora é o laranja da marca
        red: "#f79300",
        redDark: "#d97a00",
        massas: "#f79300",
        carnes: "#0d0d0d",
        combos: "#f79300",
        veganos: "#f79300",
      },
      // Typography — scale (do @theme)
      fontSize: {
        caption: ["13px", { lineHeight: "1.23" }],
        navLabel: ["15px", { lineHeight: "1.33", letterSpacing: "0.795px" }],
        body: ["17px", { lineHeight: "1.18" }],
        subheading: ["19px", { lineHeight: "1.4" }],
        "heading-sm": ["32px", { lineHeight: "1.2" }],
        heading: ["48px", { lineHeight: "1.2", letterSpacing: "-0.96px" }],
        display: ["64px", { lineHeight: "1.2", letterSpacing: "-1.28px" }],
      },
      letterSpacing: {
        heading: "-0.96px",
        display: "-1.28px",
        navLabel: "0.795px",
      },
      lineHeight: {
        caption: "1.23",
        navLabel: "1.33",
        body: "1.18",
        subheading: "1.4",
        headingSm: "1.2",
        heading: "1.2",
        display: "1.2",
      },
      // Spacing tokens (8..96)
      spacing: {
        8: "8px",
        12: "12px",
        16: "16px",
        24: "24px",
        32: "32px",
        40: "40px",
        48: "48px",
        64: "64px",
        80: "80px",
        96: "96px",
      },
      borderRadius: {
        xl: "12px",
        brand: "16px",
      },
    },
  },
  plugins: [],
};
