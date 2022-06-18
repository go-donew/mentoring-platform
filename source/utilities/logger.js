// source/utilities/logger.ts
// Exports a logger.

import pino from 'pino'

import { config } from './config.js'

// The options for the logger.
const options = {
	customLevels: {
		silly: 10,
		info: 20,
		http: 30,
		warn: 40,
		error: 50,
		fatal: 60,
	},
	transport: {
		target: 'pino-pretty',
		options: {
			translateTime: 'SYS:standard',
			ignore: 'pid,hostname',
			customLevels: 'silly:10,info:20,http:30,warn:40,error:50,fatal:60',
			customColors: 'silly:magenta,info:green,http:blue,warn:yellow,error:red,fatal:red',
		},
	},
	level: 'silly',
}
// Log colorfully when we are in a development environment, else use the
// standard JSON logger.
if (config.prod) delete options.transport

// Export the logger
export const logger = pino(options)
