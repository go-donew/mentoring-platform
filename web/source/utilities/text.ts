// source/utilities/text.ts
// A list of labels, errors and messages used in the app.

// A collection of labels, errors and messages.
const text: Record<'label' | 'error' | 'info', Record<string, string>> = {
	label: {},
	error: {
		'invalid-email-address': 'Please enter a valid email and try again.',
		'weak-password':
			'The password you entered was too weak. Please try again with a longer (> 6 letters) password.',
		'incorrect-credentials':
			'The email/password entered was incorrect. Please try again with valid credentials.',
		'expired-credentials': 'Please sign in to view this page.',
		'user-already-exists':
			'A user with the same email address already exists. Perhaps you meant to sign in?',
		'user-does-not-exist':
			'No user exists with that email address. Perhaps you mean to create an account?',
		'group-does-not-exist': 'This group does not exist or was deleted.',
		'attribute-does-not-exist': 'This attribute does not exist or was deleted.',
		'conversation-does-not-exist':
			'This conversation does not exist or was deleted.',
		'could-not-save-question':
			'An unexpected error occurred while saving the question.',
		'option-was-not-selected': 'Please select an option to continue.',
		'server-crash':
			'An unexpected error occurred. Please try again in a few seconds or report this issue.',
		'network-error':
			'A network error occurred while signing in. Please check your internet connectivity and try again.',
		'incomplete-input': 'Please fill in all the required fields.',
	},
	info: {
		'signing-in': 'Signing you in...',
		'signed-in': 'Successfully signed you in!',
		'signing-up': 'Creating your account...',
		'signed-up': 'Welcome to the DoNew Mentoring Platform!',
		'saved-conversation':
			'Successfully saved the conversation and all its questions!',
	},
}

/**
 * A function to get a piece of text.
 *
 * @param {'label' | 'error' | 'info'} category - The category to search in for the text.
 * @param {string} name - The name of the text to return.
 *
 * @returns {string} - The requested text.
 */
const get = (category: 'label' | 'error' | 'info', name: string): string => {
	return text[category][name]
}

export const labels = {
	get: (name: keyof typeof text['label']) => get('label', name),
}
export const errors = {
	get: (name: keyof typeof text['error']) => get('error', name),
}
export const messages = {
	get: (name: keyof typeof text['info']) => get('info', name),
}
