// config/tailwind.cjs
// Define and export Tailwind configuration.

const colors = require('tailwindcss/colors')

const config = {
	// Pick up Tailwind classes that appear in `tsx` files.
	content: ['source/**/*.tsx'],
	// Toggle dark mode based on what class is present in the DOM.
	darkMode: 'class',
	theme: {
		// Use `manrope` as the default font, and `ibm-plex-mono` for monospace text.
		fontFamily: {
			sans: ['Manrope', 'sans-serif'],
			serif: ['Manrope', 'serif'],
			mono: ['"JetBrains Mono"', 'monospace'],
		},
		// The colors to be used in the theme.
		colors: {
			// Use Tailwind's default colors too.
			...colors,

			/**
			 * Logo colors:
			 *
			 * blue - #0A518B
			 * black - #211D1E
			 * green - #50A150
			 * red - #E02A37
			 */

			// Define light mode colors.
			primary: '#386fa4',
			'on-primary': '#ffffff',
			secondary: '#59a5d8',
			'on-secondary': '#ffffff',
			error: '#ba1b1b',
			'on-error': '#ffffff',
			background: '#fbfdf8',
			'on-background': '#191c1a',
			surface: '#f5f5f5',
			'on-surface': '#191c1a',

			// Define dark mode colors.
			'primary-dark': '#133c55',
			'on-primary-dark': '#e2e3df',
			'secondary-dark': '#59a5d8',
			'on-secondary-dark': '#e2e3df',
			'error-dark': '#ffb4a9',
			'on-error-dark': '#680003',
			'background-dark': '#1d2026',
			'on-background-dark': '#e2e3df',
			'surface-dark': '#13151a',
			'on-surface-dark': '#e2e3df',
		},
	},
}

// Export the configuration for Tailwind to use.
module.exports = config
