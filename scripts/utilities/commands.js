// scripts/utilities/commands.ts
// Exports helper functions to run system commands.

import { stdout, stderr } from 'node:process'
import { spawn } from 'node:child_process'

/**
 * Runs a command using `spawn()`.
 */
export const exec = (command, options) => {
	return new Promise((resolve, reject) => {
		// Start the process.
		const [file, ...args] = command.split(' ')
		const child = spawn(file, args)
		// Pipe its output to the same channel as this process.
		child.stdout.on('data', (content) => (options?.quiet ? {} : stdout.write(content.toString())))
		child.stderr.on('data', (content) => (options?.quiet ? {} : stderr.write(content.toString())))
		// Once it's finished, resolve/reject the promise based
		// on the process' exit code.
		child.on('close', (code) => (code === 0 ? resolve() : reject(code)))
	})
}
