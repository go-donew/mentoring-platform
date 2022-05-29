// source/pages/signin.tsx
// Defines and exports the signin page.

import { useReducer, useState } from 'preact/hooks'
import { route } from 'preact-router'

import { Button, TextInput, Toast, AuthHeader, PageWrapper } from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'
import { storage } from '@/utilities/storage'

import type { User, Tokens } from '@/api'

/**
 * The fields that can be filled in the sign in form.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
interface SignInForm {
	email: string
	password: string
}
/**
 * The action that is dispatched to the reducer to update the form's state.
 *
 * @param {'update-field'} type - The type of action to perform.
 * @param {'email' | 'password'} field - The field which is concerned with the action.
 * @param {string?} payload - The payload, if any.
 */
interface SignInFormAction {
	type: 'update-field'
	field: keyof SignInForm
	payload?: string
}

/**
 * The signin page.
 *
 * @page
 */
export const SignInPage = () => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {Partial<SignInForm>} state - The current state of the form.
	 * @param {SignInFormAction} action - The action to perform.
	 */
	const reducer = (
		state: Partial<SignInForm>,
		action: SignInFormAction,
	): Partial<SignInForm> => {
		// Parse the action, and do something with it.
		switch (action.type) {
			case 'update-field':
				// Check that the payload is not blank.
				if (typeof action.payload === 'undefined') break
				// If not, update the state of the form.
				return {
					...state,
					[action.field]: action.payload,
				}
			default:
				return state
		}

		return state
	}

	// Create the reducer.
	const [signInForm, dispatch] = useReducer<
		Partial<SignInForm>,
		SignInFormAction
	>(reducer, {
		email: undefined,
		password: undefined,
	})

	// Define a state if we need to show error messages.
	const passedOnError = new URLSearchParams(window.location.search).get('error')
	const [currentError, setErrorMessage] = useState<string | undefined>(
		passedOnError ? errors.get(passedOnError) : undefined,
	)

	/**
	 * Sign the user into their account.
	 */
	const signIn = async (): Promise<void> => {
		// First, validate the form's fields.
		const validation = {
			email: /^\S+@\S+$/, // Make sure the string contains an @
			// We don't need to check the password, do that only on the sign up page.
		}

		// Reset the error
		setErrorMessage(undefined)
		// Then show a new one, if needed
		if (!validation.email.test(signInForm.email ?? ''))
			return setErrorMessage(errors.get('invalid-email-address'))

		// If the validation tests pass, then make the API call to sign the user in.
		const response = await fetch<{ user: User; tokens: Tokens }>({
			url: '/auth/signin',
			method: 'post',
			json: signInForm,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response)) {
			const { error } = response

			switch (error.code) {
				case 'improper-payload':
					setErrorMessage(errors.get('invalid-email-address'))
					break
				case 'incorrect-credentials':
					setErrorMessage(errors.get('incorrect-credentials'))
					break
				case 'entity-not-found':
					setErrorMessage(errors.get('user-does-not-exist'))
					break
				default:
					setErrorMessage(error.message)
			}

			return
		}

		// Save the user data and tokens in local storage.
		storage.set('user', response.user)
		storage.set('tokens', response.tokens)

		// Then route the user to the home page.
		route('/', true)
	}

	return (
		<PageWrapper>
			<div class="flex items-center justify-center py-12">
				<div class="max-w-md w-full space-y-8">
					<AuthHeader mode="signin" />
					<div class="shadow overflow-hidden rounded-lg bg-background dark:bg-background-dark">
						<div class="m-2 px-5 py-5">
							<form class="space-y-6">
								<TextInput
									id="email-input"
									label="Email address"
									type="email"
									placeholder="name@email.com"
									value={signInForm.email}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'email',
											payload: value,
										})
									}
								/>
								<TextInput
									id="password-input"
									label="Password"
									type="password"
									placeholder="correcthorsebatterystaple"
									value={signInForm.password}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'password',
											payload: value,
										})
									}
								/>
								<div class="flex justify-center">
									<Button
										id="signin-button"
										text="Sign In"
										action={signIn}
										type="filled"
										class="w-full"
									/>
								</div>
							</form>
						</div>
					</div>
					<Toast id="error-message" type="error" text={currentError} />
				</div>
			</div>
		</PageWrapper>
	)
}
