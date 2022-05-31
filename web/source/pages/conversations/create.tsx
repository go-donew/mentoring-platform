// source/pages/conversations/create.tsx
// Defines and exports the conversation create page.

import { useState, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Label,
	Button,
	TextInput,
	SelectInput,
	Toast,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'

import type { Conversation } from '@/api'

/**
 * The form's state.
 */
type ConversationFormState = Partial<Omit<Conversation, 'id'>>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type ConversationCreateFormAction = {
	type: 'update-field'
	field: keyof Conversation
	payload?: any
}

/**
 * The conversation create page.
 *
 * @page
 */
export const ConversationCreatePage = () => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {Conversation?} state - The current state of the form.
	 * @param {ConversationCreateFormAction} action - The action to perform.
	 */
	const reducer = (
		state: ConversationFormState,
		action: ConversationCreateFormAction,
	): ConversationFormState => {
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
	const [conversation, dispatch] = useReducer<
		ConversationFormState,
		ConversationCreateFormAction
	>(reducer, {})

	// Define a state for error messages.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)

	/**
	 * Create the conversation using the API.
	 */
	const createConversation = async () => {
		// Reset the error
		setErrorMessage(undefined)

		// Make sure the `once` field is set.
		conversation.once =
			typeof conversation.once === 'undefined' ? false : conversation.once

		// Make the API call to create the conversation.
		const response = await fetch<{ conversation: Conversation }>({
			url: '/conversations',
			method: 'post',
			json: conversation,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)

		// Then route the user to the conversation edit page, so they can add
		// questions to the conversation.
		route(`/conversations/${response.conversation.id}/edit`)
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Create Conversation
					</h5>
				</div>
				<div>
					<div class="overflow-x-auto sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="conversation-name"
									value={conversation?.name}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'name',
											payload: value,
										})
									}
								/>
							</div>
							<div class="col-span-6 sm:col-span-3">
								<Label for="once-input" text="Once" required={true} />
								<SelectInput
									id="once-input"
									options={[
										{ text: 'No', value: 'false' },
										{ text: 'Yes', value: 'true' },
									]}
									selected={conversation?.once ? 'true' : 'false'}
									update={(value: string) => {
										dispatch({
											type: 'update-field',
											field: 'once',
											payload: value !== 'false',
										})
									}}
								/>
							</div>
							<div class="col-span-6">
								<TextInput
									id="description-input"
									label="Description"
									type="conversation-description"
									value={conversation?.description}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'description',
											payload: value,
										})
									}
								/>
							</div>
							<div class="col-span-6">
								<TextInput
									id="tags-input"
									label="Tags"
									type="conversation-tags"
									value={conversation?.tags?.join(', ')}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'tags',
											payload: value
												.split(', ')
												.map((tag) => tag.trim())
												.filter(Boolean),
										})
									}
								/>
							</div>
						</div>
					</div>
					<div class="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6 md:gap-6">
						<div class="hidden md:block md:col-span-4"></div>
						<Button
							id="back-button"
							text="Cancel"
							action={() => route('/conversations')}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="save-button"
							text="Create"
							action={async () => createConversation()}
							type="filled"
							class="col-span-2 md:col-span-1"
						/>
					</div>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
