// scripts/develop.ts
// Watches the `source/` folder for changes and reloads the function then.

import nodemon from 'nodemon'

nodemon({
	exec: 'functions-framework --quiet --target api',
	quiet: true,
	watch: ['source/'],
}).on('quit', function () {
	process.exit()
})
