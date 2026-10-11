/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: { bg: v("bg"), card: v("card"), raised: v("raised"), line: v("line"), ink: v("ink"), mute: v("mute"), faint: v("faint"),
      saffron: { DEFAULT: "#FF7A2F", soft: "#FFB37E" }, leaf: { DEFAULT: "#13A86B", soft: "#7FDDB2" }, indigo: { DEFAULT: "#3B3FD8", deep: "#1C1F6E", soft: "#A9ABFF" }, ruby: "#E5484D", sun: "#F5B400" },
    fontFamily: { display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"], sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"] },
    keyframes: { ticker: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } }, ping2: { "0%": { transform: "scale(1)", opacity: ".7" }, "100%": { transform: "scale(2.4)", opacity: "0" } } },
    animation: { ticker: "ticker 40s linear infinite", ping2: "ping2 1.8s ease-out infinite" },
  } }, plugins: [],
};
