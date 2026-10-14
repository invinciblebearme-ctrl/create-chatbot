/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#eaf0ff',
          200: '#d4defc',
          300: '#b2c2f7',
          400: '#8ba0ed',
          500: '#687fe0', // create.allforedu.kr 대표 시그니처 블루
          600: '#566ecf', // 버튼 hover
          700: '#485cb5',
          800: '#3b4a92',
          900: '#34415c', // 짙은 슬레이트 네이비
        },
        createSlate: {
          900: '#33445f',
          800: '#34476a',
          700: '#374f7e',
          600: '#67768e',
          500: '#697b98',
          400: '#8b9ab7',
          300: '#c5d4fa',
          200: '#e2e8f4',
          100: '#e8edf7',
          50: '#f8faff',
        },
        tint: {
          blue: '#eaf2ff',
          mint: '#e6f8ef',
          peach: '#fff0e3',
          lavender: '#f1ecff',
          pink: '#ffedf3',
          aqua: '#e6f8fa',
        }
      },
      fontFamily: {
        sans: [
          'Nunito',
          'Noto Sans KR',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ]
      },
      boxShadow: {
        'card': '0 5px 22px rgba(164, 176, 202, 0.12)',
        'card-hover': '0 12px 30px rgba(154, 170, 202, 0.22)',
        'btn': '0 7px 16px rgba(108, 128, 218, 0.27)',
        'pill': '0 6px 15px rgba(104, 127, 224, 0.23)',
      }
    },
  },
  plugins: [],
}
