// source/pages/attributes/list.tsx
// Defines and exports the attribute list page.

import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Button,
	Chip,
	Toast,
	LoadingIndicator,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'

import type { Conversation, Attribute } from '@/api'

/**
 * A item that shows a attribute in the list.
 *
 * @prop {Attribute} attribute - The attribute to render.
 * @prop {boolean} allowEdit - Whether to allow the user to edit a attribute.
 *
 * @component
 */
const AttributeItem = (props: { attribute: Attribute; allowEdit: boolean }) => {
	const [attribute, setAttribute] = useState<Attribute>(props.attribute)

	// Fetch the name of the conversations so we can display that instead of
	// their IDs.
	useEffect(() => {
		const fetchConversation = async (
			id: string,
		): Promise<Conversation | undefined> => {
			const response = await fetch<{ conversation: Conversation }>({
				url: `/conversations/${id}`,
				method: 'get',
			})

			// If an error occurs, skip over.
			if (isErrorResponse(response)) return
			// And if there are none, return the data.
			return response.conversation
		}

		const replaceIds = async (): Promise<Attribute> => {
			const conversationsByIds = attribute.conversations
			attribute.conversations = []

			// Replace the IDs with the name and email.
			for (const conversationId of conversationsByIds) {
				const conversation = await fetchConversation(conversationId)

				if (conversation)
					attribute.conversations.push(
						`${conversation.name} {${conversation.id}}`,
					)
			}

			return attribute
		}

		replaceIds()
			.then((attribute) =>
				setAttribute({
					...attribute,
				}),
			)
			.catch((_error) => {})
	}, [])

	return (
		<tr class="border-b dark:border-gray-700 text-sm">
			<td class="p-2">
				<span class="text-gray-800 dark:text-gray-300">{attribute.name}</span>
			</td>
			<td class="p-2">
				<span class="text-gray-600 dark:text-gray-400">
					{attribute.description}
				</span>
			</td>
			<td class="p-2">
				{attribute.tags.map((tag) => (
					<Chip value={tag} />
				))}
			</td>
			<td class="p-2">
				{attribute.conversations.map((conversation) => {
					// The conversations string is packed with conversation info in the following
					// format: `<name> {<id>}`
					const conversationIdMatches = /{(.*?)}/.exec(conversation)
					const conversationId = conversationIdMatches
						? conversationIdMatches[1]
						: conversation
					const conversationName = conversation
						.replace(conversationId, '')
						.replace('{}', '')
						.trim()

					return (
						<>
							<a href={`/conversations/${conversationId}/edit`}>
								<span class="text-gray-900 dark:text-white">
									{conversationName}
								</span>
							</a>
							<br />
						</>
					)
				})}
			</td>
			<td class="h-4 p-2 text-right">
				<Button
					id="edit-attribute-button"
					text="Edit"
					action={() => route(`/attributes/${attribute.id}/edit`)}
					type="text"
					class={`col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold ${
						props.allowEdit ? '' : 'hidden'
					}`}
				/>
			</td>
		</tr>
	)
}

/**
 * The attribute list page.
 *
 * @prop {boolean} groot - Whether or not the conversation is Groot.
 *
 * @page
 */
export const AttributeListPage = (props: { groot: boolean }) => {
	// Define a state for error messages and attributes.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [attributes, setAttributes] = useState<Attribute[] | undefined>(
		undefined,
	)

	// Fetch the attributes using the API.
	useEffect(() => {
		const fetchAttributes = async (): Promise<Attribute[]> => {
			const response = await fetch<{ attributes: Attribute[] }>({
				url: '/attributes',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.attributes
		}

		fetchAttributes()
			.then(setAttributes)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Attributes
					</h5>
					<Button
						id="create-attribute-button"
						text="Create"
						action={() => route('/attributes/create')}
						type="filled"
						class={props.groot ? 'block' : 'hidden'}
					/>
				</div>
				<LoadingIndicator isLoading={typeof attributes === 'undefined'} />
				<div
					class={`overflow-x-auto sm:rounded-lg ${
						typeof attributes === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase dark:text-gray-400 text-left">
							<tr>
								<th class="p-2">Name</th>
								<th class="p-2">Description</th>
								<th class="p-2">Tags</th>
								<th class="p-2">Conversations</th>
								<th class="p-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="p-4">
							{attributes?.map((attribute: Attribute) => (
								<AttributeItem attribute={attribute} allowEdit={props.groot} />
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
