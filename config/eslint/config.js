// config.js
// The ESLint configuration for DoNew projects.

const config = {
	rules: {
		'@typescript-eslint/no-empty-function': 0,
		'@typescript-eslint/no-confusing-void-expression': 0,
		'@typescript-eslint/no-unsafe-assignment': 0,
		'@typescript-eslint/no-unsafe-call': 0,
		'@typescript-eslint/no-unsafe-return': 0,
		'@typescript-eslint/restrict-template-expressions': 0,
		'import/extensions': [2, 'never'],
		'capitalized-comments': 0,
		'no-await-in-loop': 0,
	},
}

module.exports = config
