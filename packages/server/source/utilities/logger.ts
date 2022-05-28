// @/utilities/logger.ts
// Defines and exports a logger.

import { createLogger, addColors, transports, format } from 'winston'
import chalk from 'chalk'
import redent from 'redent'

const json = JSON

// The log levels (lowest number = highest priority) and their corresponding
// colors
const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	silly: 4,
}
const colors = {
	error: 'red',
	warn: 'yellow',
	info: 'green',
	http: 'cyan',
	silly: 'grey',
}
// Tell winston about these colors
addColors(colors)

// Create and export a winston logger
export const logger = createLogger({
	transports: [new transports.Console()],
	format: format.combine(
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		format.colorize({ all: true }),
		format.splat(),
		format.printf(
			({ timestamp, level, message }) =>
				`${chalk.dim(timestamp)} ${chalk.bold(level)}: ${message}`,
		),
	),
	levels,
	level: 'silly',
})

/**
 * A function that pretty-prints a JSON object
 */
export const stringify = (object: any): string => {
	return typeof object === 'undefined'
		? ''
		: `\n${chalk.dim(redent(json.stringify(object, undefined, 2), 2))}`
}
