import eslintConfig from "eslint-config-next";

/** Next.js 16 — preset ESLint 9 flat; evitar FlatCompat (rompe con plugins circulares). */
const config = [
  ...eslintConfig,
  {
    ignores: ["node_modules/**"],
  },
];

export default config;
