// scripts/test
// Runs all the tests for the server.

import { stdout, env, exit } from 'node:process'
import { spinner } from 'zx/experimental'

import waitOn from 'wait-on'

import { logger } from './utilities/logger.js'
import { object } from './utilities/globals.js'

logger.title('scripts/test')

// Setup the environment.
const config = (await fs.readJson('package.json')).env.test
for (const [variable, value] of object.entries(config)) env[variable] = value

// Start the emulators.
let emulators
await spinner(logger.status('starting emulators'), async () => {
	// Let the process run in the background, and return when the Emulator UI is up.
	// eslint-disable-next-line no-unused-expressions
	emulators = $`pnpm firebase emulators:start --only firestore,auth --project donew-mentoring-api-sandbox`
	await waitOn({ resources: ['http://localhost:4000'] })
})
logger.success('successfully started emulators')

logger.info('running tests')
stdout.write('\n')

try {
	// Run the tests.
	const options = [
		argv.watch && '--watch',
		argv.coverage && '--coverage',
	].filter((option) => option !== undefined)
	await $`pnpm jest ${options}`.pipe(stdout)

	// Once they finish, kill the emulator and exit peacefully.
	logger.success('sucessfully ran all tests')
	logger.end()

	await spinner(logger.status('stopping emulators'), () => emulators.kill())

	exit(0)
} catch (error) {
	// If an error occurs, print an error and kill the emulators.
	logger.error('one or more tests failed')
	logger.end()
	await spinner(logger.status('stopping emulators'), () => emulators.kill())

	// Then exit with a non-zero exit code.
	exit(error.exitCode)
}
