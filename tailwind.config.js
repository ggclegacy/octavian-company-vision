/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coal: "#0E0D0B",
        soot: "#1B2D24",
        smoke: "#34302B",
        ember: "#7A2418",
        gold: "#D6A43A",
        bone: "#F0E4D0",
        ash: "#C9BDA9",
        iron: "#8D867A"
      },
      boxShadow: {
        ember: "0 22px 70px rgba(214, 164, 58, 0.14)",
        oak: "0 24px 80px rgba(0, 0, 0, 0.42)"
      }
    },
  },
  plugins: [],
};
