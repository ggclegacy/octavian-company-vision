/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coal: "#0d0c0a",
        soot: "#171512",
        smoke: "#24211d",
        ember: "#c98f33",
        gold: "#e0b15f",
        bone: "#f5efe5",
        ash: "#bdb4a8",
        iron: "#7c766d"
      },
      boxShadow: {
        ember: "0 18px 60px rgba(201, 143, 51, 0.15)"
      }
    },
  },
  plugins: [],
};
