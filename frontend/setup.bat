@echo off
echo Installing frontend dependencies...

call npm install ^
  @headlessui/react ^
  @heroicons/react ^
  @tanstack/react-query ^
  @types/node ^
  @types/react ^
  @types/react-dom ^
  @types/react-window ^
  @typescript-eslint/eslint-plugin ^
  @typescript-eslint/parser ^
  @vitejs/plugin-react-swc ^
  autoprefixer ^
  axios ^
  chart.js ^
  clsx ^
  date-fns ^
  eslint ^
  eslint-plugin-react-hooks ^
  eslint-plugin-react-refresh ^
  framer-motion ^
  postcss ^
  prettier ^
  prettier-plugin-tailwindcss ^
  react ^
  react-chartjs-2 ^
  react-dom ^
  react-error-boundary ^
  react-hook-form ^
  react-router-dom ^
  react-virtualized-auto-sizer ^
  react-window ^
  socket.io-client ^
  tailwind-merge ^
  tailwindcss ^
  typescript ^
  vite ^
  vitest ^
  zod ^
  zustand

echo Frontend dependencies installed successfully! 