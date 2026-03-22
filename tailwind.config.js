import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                orchid: {
                    blue: '#4568dc',
                    purple: '#b06ab3',
                },
            },
            keyframes: {
                breathe: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                'title-pulse': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.92' },
                },
            },
            animation: {
                breathe: 'breathe 12s ease-in-out infinite',
                'title-pulse': 'title-pulse 8s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
