// source/utilities/logger.ts
// Exports a logger.

import pino from 'pino'

import { config } from './config.js'

// The options for the logger.
const options = {
	customLevels: {
		silly: 40,
		info: 50,
		http: 60,
		warn: 70,
		error: 80,
		fatal: 90,
	},
	transport: {
		target: 'pino-pretty',
		options: {
			translateTime: 'SYS:standard',
			ignore: 'pid,hostname',
			customLevels: 'silly:40,info:50,http:60,warn:70,error:80,fatal:90',
			customColors:
				'silly:magenta,info:green,http:blue,warn:yellow,error:red,fatal:red',
		},
	},
	level: 'silly',
	useLevelLabels: true,
	useOnlyCustomLevels: true,
}
// Log colorfully when we are in a development environment, else use the
// standard JSON logger.
if (config.prod) delete options.transport
// Log only errors in a test environment.
if (config.test) options.level = 'error'

// Export the logger
export const logger = pino(options)
