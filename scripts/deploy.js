// scripts/deploy.ts
// Generates a `package-lock.json` file, and then deploys the function.

import { rm, writeFile } from 'node:fs/promises'
import { stdout, stderr } from 'node:process'
import { spawn } from 'node:child_process'

const json = JSON

/**
 * Runs a command using `spawn()`.
 */
const exec = (...spawnArgs) => {
	return new Promise((resolve, reject) => {
		// Start the process.
		const child = spawn(...spawnArgs)
		// Pipe its output to the same channel as this process.
		child.stdout.on('data', (content) => stdout.write(content.toString()))
		child.stderr.on('data', (content) => stderr.write(content.toString()))
		// Once it's finished, resolve/reject the promise based
		// on the process' exit code.
		child.on('close', (code) => (code === 0 ? resolve() : reject(code)))
	})
}

// Delete the existing `node_modules/` folder.
await rm('node_modules/', { recursive: true })
// Get npm to install packages its way.
await exec('npm', ['install'])

// Generate a firebase config file.
await writeFile(
	'firebase.json',
	json.stringify({
		functions: {
			source: '.',
			runtime: 'nodejs16',
		},
	}),
)
// Then deploy the function.
await exec('firebase', ['deploy', '--only', 'functions:api', '--project', 'donew-mentoring-api-sandbox'])

// Re-install the node modules using pnpm.
await exec('pnpm', ['install'])
// Delete the firebase config file.
await rm('firebase.json')
