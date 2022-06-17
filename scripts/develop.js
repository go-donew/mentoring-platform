// scripts/develop.ts
// Watches the `source/` folder for changes and reloads the function then.

import { spawn } from 'node:child_process'
import { exit, kill } from 'node:process'

import nodemon from 'nodemon'

// Start the Firestore emulator.
const emulator = spawn(
	'firebase',
	['emulators:start', '--only firestore,auth', '--project donew-mentoring-api-sandbox'],
	{
		stdio: 'ignore',
		detached: true,
	},
)
emulator.unref()

nodemon({
	exec: 'functions-framework --quiet --target api --port 4242',
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
}).on('quit', function () {
	// Stop the emulator, and then exit the program.
	kill(emulator.pid)
	exit()
})
