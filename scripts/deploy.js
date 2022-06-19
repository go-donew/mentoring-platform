// scripts/deploy.ts
// Generates a `package-lock.json` file, and then deploys the function.

import { rm } from 'node:fs/promises'

import { logger } from './utilities/logger.js'
import { exec } from './utilities/commands.js'

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

	// Then deploy the function.
	logger.info('deploying function to google cloud')
	await exec(
		'gcloud functions deploy api --source ./ --runtime nodejs16 --trigger-http --allow-unauthenticated --project donew-mentoring-api-sandbox',
		{ quiet: true },
	)
	logger.success('sucessfully deployed function')

	// Cleanup the environment.
	logger.info('cleaning up')
	// Re-install the node modules using pnpm.
	await exec('pnpm install', { quiet: true })

	logger.success('sucessfully deployed function')
}

main().catch((error) => logger.error('an error occurred:', error.message))
