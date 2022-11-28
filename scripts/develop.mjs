// scripts/develop
// Watches the `source/` folder for changes and reloads the function then.

import { exit, stdout } from 'node:process'
import { spinner } from 'zx/experimental'

import { config as loadConfig } from 'dotenv'
import waitOn from 'wait-on'
import nodemon from 'nodemon'

import { logger } from './utilities/logger.js'

logger.title('scripts/develop')

// Read the development configuration file.
const { parsed: config } = loadConfig({ path: 'config/env/dev.env' })

// Start the emulators.
await spinner(logger.status('starting emulators'), async () => {
	// Let the process run in the background, and return when the Emulator UI is up.
	// eslint-disable-next-line no-unused-expressions
	$`pnpm firebase emulators:start --only firestore,auth --project donew-mentoring-api-sandbox`

	// Do not use `localhost` here, since the emulators bind to the IPV4
	// `127.0.0.1`, and not the IPV6 `::1`. `wait-on` checks for `::1` if
	// you use `localhost`.
	await waitOn({ resources: ['http://127.0.0.1:4000'] })
})
logger.success('successfully started emulators')

// Then watch the `source/` directory, and keep restarting the server
// whenever a change occurs.
logger.info('watching `source/` for changes')
logger.info('running server on port', config.PORT)
stdout.write('\n')
nodemon({
	exec: `pnpm functions-framework --quiet --target api --port ${config.PORT}`,
	quiet: true,
	watch: ['source/'],
	env: config,
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
