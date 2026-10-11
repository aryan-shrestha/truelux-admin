const config = {
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 is configured in CSS; without this the plugin cannot see the theme
  // tokens and sorts them as unknown classes.
  tailwindStylesheet: "./src/styles/globals.css",
};

export default config;
