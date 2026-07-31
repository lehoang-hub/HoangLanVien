/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Dòng này báo cho Tailwind quét toàn bộ file trong thư mục src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}