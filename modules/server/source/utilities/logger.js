// source/utilities/logger.ts
// Exports configuration for the logger.

export const options = {
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
