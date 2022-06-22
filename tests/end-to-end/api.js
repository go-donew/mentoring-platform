// tests/end-to-end/api.js
// Tests all the REST API endpoints in order.

import { auth } from './auth.js'
import { users } from './users.js'

describe('auth', auth)
describe('users', users)
