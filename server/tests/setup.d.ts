// @/setup.d.ts
// Set up the types for the tests

declare module 'jest' {
	interface Matchers<R> {
		toMatchShapeOf(expected: any): R
		toMatchOneOf(expected: any[]): R
	}
}
