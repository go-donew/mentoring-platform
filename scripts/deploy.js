// scripts/deploy.ts
// Generates a `package-lock.json` file, and then deploys the function.

import { rm, writeFile } from 'node:fs/promises'
import { stdout } from 'node:process'

import { logger } from './utilities/logger.js'
import { exec } from './utilities/commands.js'

const json = JSON

const main = async () => {
	logger.title('scripts/deploy')

	// Prepare for the deploy.
	logger.info('preparing environment for deploy')

	// Delete the existing `node_modules/` folder and get npm to install packages
	// its way.
	logger.info('generating `package-lock.json` using npm')
	await rm('node_modules/', { recursive: true })
	await exec('npm install', { quiet: true })
	logger.success('successfully generated npm lockfile')

	// Generate a firebase config file.
	logger.info('writing `firebase.json` config file')
	await writeFile(
		'firebase.json',
		json.stringify({
			functions: {
				source: '.',
				runtime: 'nodejs16',
			},
		}),
	)
	logger.success('sucessfully saved deploy config')

	// Then deploy the function.
	await exec('firebase deploy --only functions:api --project donew-mentoring-api-sandbox')
	stdout.write('\n')

	// Cleanup the environment.
	logger.info('cleaning up')

	// Re-install the node modules using pnpm.
	await exec('pnpm install', { quiet: true })
	await rm('firebase.json')

	logger.success('sucessfully deployed function')
}

main()
