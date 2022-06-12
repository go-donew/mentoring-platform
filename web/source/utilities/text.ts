// source/utilities/text.ts
// A list of labels, errors and messages used in the app.

// A collection of labels, errors and messages.
const text = {
	label: {},
	error: {
		'incomplete-input': 'Please fill in all the required fields.',
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
		'first-question-not-found': 'The conversation has no first question.',
		'script-attribute-not-found': 'Could not find attribute with name ',
		'report-attribute-not-found': 'Could not find attribute with name ',
		'question-attribute-not-found': 'Could not find attribute with name ',
		'not-allowed-to-take-conversation':
			'You are not allowed to take the conversation at this time.',
		'report-not-generated': 'This report is yet to be generated.',
		'server-crash':
			'An unexpected error occurred. Please try again in a few seconds or report this issue.',
		'network-error':
			'A network error occurred while signing in. Please check your internet connectivity and try again.',
	},
	info: {
		'signing-in': 'Signing you in...',
		'signed-in': 'Successfully signed you in!',
		'signing-up': 'Creating your account...',
		'signed-up': 'Welcome to the DoNew Mentoring Platform!',
		'saved-conversation':
			'Successfully saved the conversation and all its questions!',
		'saved-report': 'Successfully saved the report!',
		'script-ran-successfully': 'Successfully ran the script!',
	},
}

export const labels = {
	get: (name: keyof typeof text['label']) => text.label[name],
}
export const errors = {
	get: (name: keyof typeof text['error']) => text.error[name],
}
export const messages = {
	get: (name: keyof typeof text['info']) => text.info[name],
}
