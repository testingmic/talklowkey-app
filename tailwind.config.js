/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4361EE",
        secondary: "#3F37C9",
        accent: "#4CC9F0",
        danger: "#F72585",
        warning: "#F9C74F",
        success: "#90BE6D",
        background: "#121212",
        card: "#1E1E1E",
        text: "#F8F9FA",
        textSecondary: "#ADB5BD",
      },
    },
  },
  plugins: [],
}

