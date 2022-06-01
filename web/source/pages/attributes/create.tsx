// source/pages/attributes/create.tsx
// Defines and exports the attribute create page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Button,
	TextInput,
	SelectInput,
	Toast,
	PageWrapper,
	IconButton,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'

import type { Conversation, Attribute } from '@/api'

/**
 * The form's state.
 */
type AttributeFormState = Partial<Omit<Attribute, 'id'>>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type AttributeCreateFormAction = {
	type: 'update-field'
	field: keyof Attribute
	payload?: any
}

/**
 * The attribute create page.
 *
 * @page
 */
export const AttributeCreatePage = () => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {AttributeFormState} state - The current state of the form.
	 * @param {AttributeCreateFormAction} action - The action to perform.
	 */
	const reducer = (
		state: AttributeFormState,
		action: AttributeCreateFormAction,
	): AttributeFormState => {
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
	const [attribute, dispatch] = useReducer<
		AttributeFormState,
		AttributeCreateFormAction
	>(reducer, {})

	// Define a state for error messages and the list of conversations.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	// This list of conversations is used to fill the dropdown, so Groot can choose which
	// conversations to add to the attribute.
	const [conversations, setConversations] = useState<Conversation[]>([])

	// Fetch the conversations using the API.
	useEffect(() => {
		const fetchConversations = async (): Promise<Conversation[]> => {
			const response = await fetch<{ conversations: Conversation[] }>({
				url: '/conversations',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.conversations
		}

		fetchConversations()
			.then(setConversations)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Create the attribute using the API.
	 */
	const createAttribute = async () => {
		// Clear the error message.
		setErrorMessage(undefined)
		// Delete any blank conversation IDs from the attribute.
		attribute.conversations = attribute.conversations
			? attribute.conversations.filter(Boolean)
			: []

		// Make the API call to create the attribute.
		const response = await fetch<{ attribute: Attribute }>({
			url: '/attributes',
			method: 'post',
			json: attribute,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)

		// Then route the conversation to the attribute list page.
		route('/attributes')
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Create Attribute
					</h5>
				</div>
				<div>
					<div class="overflow-x-auto sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="attribute-name"
									value={attribute?.name}
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
								<TextInput
									id="tags-input"
									label="Tags"
									type="attribute-tags"
									value={attribute?.tags?.join(', ')}
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
							<div class="col-span-6">
								<TextInput
									id="description-input"
									label="Description"
									type="attribute-description"
									value={attribute?.description}
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
							<table class="col-span-6">
								<thead>
									<tr class="text-sm text-gray-700 dark:text-gray-300">
										<th class="text-left font-medium">Conversation</th>
										<th class="text-right">
											<IconButton
												id="add-conversation-button"
												action={() =>
													dispatch({
														type: 'update-field',
														field: 'conversations',
														payload: [
															...new Set([
																...(attribute.conversations ?? []),
																'',
															]),
														],
													})
												}
												icon="add"
											/>
										</th>
									</tr>
								</thead>
								<tbody>
									{attribute?.conversations?.map((id) => {
										return (
											<tr>
												<td class="pr-3">
													<SelectInput
														id="conversation-id"
														options={conversations.map((conversation) => {
															return {
																text: `${conversation.name}`,
																value: conversation.id,
															}
														})}
														selected={id}
														update={(selectedValue: string) => {
															dispatch({
																type: 'update-field',
																field: 'conversations',
																payload: [
																	...new Set([
																		...(attribute.conversations ?? []),
																		selectedValue,
																	]),
																].filter(Boolean),
															})

															id = selectedValue
														}}
													/>
												</td>
												<td class="pr-1 text-right">
													<IconButton
														id="remove-conversation-button"
														action={() => {
															const updatedConversations =
																attribute.conversations?.filter(
																	(conversationId) => conversationId !== id,
																)

															dispatch({
																type: 'update-field',
																field: 'conversations',
																payload: updatedConversations,
															})
														}}
														icon="remove"
													/>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
					<div class="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6 md:gap-6">
						<div class="hidden md:block md:col-span-4"></div>
						<Button
							id="back-button"
							text="Cancel"
							action={() => route('/attributes')}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="save-button"
							text="Create"
							action={async () => createAttribute()}
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
