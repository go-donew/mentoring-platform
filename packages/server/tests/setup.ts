// @/setup.ts
// Set up the test environment

import { toMatchOneOf, toMatchShapeOf } from 'jest-to-match-shape-of'

// Add the shape extensions to `expect`
expect.extend({
	toMatchOneOf,
	toMatchShapeOf,
})
