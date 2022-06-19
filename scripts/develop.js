// scripts/develop.ts
// Watches the `source/` folder for changes and reloads the function then.

import { exit, kill, stdout } from 'node:process'

import waitOn from 'wait-on'
import nodemon from 'nodemon'

import { logger } from './utilities/logger.js'
import { exec } from './utilities/commands.js'

const main = async () => {
	logger.title('scripts/develop')

	// Start the emulators.
	logger.info('starting emulators')
	exec('pnpm firebase emulators:start --only firestore,auth --project donew-mentoring-api-sandbox', {
		quiet: true,
	})
	// Then wait for it to start.
	await waitOn({ resources: ['http://localhost:4000'] })
	logger.success('successfully started emulators')

	// Then watch the `source/` directory, and keep restarting the server
	// whenever a change occurs.
	logger.info('watching `source/` for changes')
	stdout.write('\n')
	nodemon({
		exec: 'pnpm functions-framework --quiet --target api --port 4242',
		quiet: true,
		watch: ['source/'],
		env: {
			PORT: 4242,
			NODE_ENV: 'development',
			FIREBASE_PROJECT_ID: 'donew-mentoring-api-sandbox',
			FIREBASE_DB_EMULATOR_HOST: 'localhost:8080',
			FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
			FIRESTORE_USE_REST_API: true,
			FIREBASE_API_KEY: 'something-complex',
		},
	})

	// Do stuff when events occur.
	nodemon.on('restart', () => {
		stdout.write('\n')
		logger.info('restarting server')
		stdout.write('\n')
	})
	nodemon.on('quit', () => {
		stdout.write('\n')
		logger.success('shutting down')
		stdout.write('\n')

		exit()
	})
}

main().catch((error) => logger.error('an error occurred:', error.message))
