/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#1B2430',
        muted: '#5B6675',
        canvas: '#F6F7F9',
        primary: {
          50: '#EAF3F2',
          100: '#CFE4E2',
          300: '#7FB3B0',
          500: '#0F6B68',
          600: '#114B5F',
          700: '#0B3A4A',
          800: '#08393A'
        },
        accent: {
          400: '#D9AB4C',
          500: '#C9962C',
          600: '#A87A1F'
        },
        leave: {
          500: '#C45B4F',
          100: '#F7E3E0'
        },
        success: {
          500: '#2F9E68',
          100: '#DEF3E8'
        },
        stream: {
          salary: '#114B5F',
          oldHospital: '#4C8C8B',
          newHospital: '#7FB3B0',
          medications: '#C9962C',
          hospitalPct: '#6B5CA5',
          mri: '#3D7DB0',
          nerve: '#4F9D69',
          eeg: '#B0563D',
          implants: '#8A8F45',
          bonus: '#2F9E68'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 75, 95, 0.06), 0 4px 16px rgba(17, 75, 95, 0.06)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};
