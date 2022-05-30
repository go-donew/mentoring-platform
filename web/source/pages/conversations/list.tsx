// source/pages/conversations/list.tsx
// Defines and exports the conversation list page.

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

import type { Conversation } from '@/api'

/**
 * A item that shows a conversation in the list.
 *
 * @prop {Conversation} conversation - The conversation to render.
 * @prop {boolean} allowEdit - Whether to allow the user to edit a conversation.
 *
 * @component
 */
const ConversationItem = (props: {
	conversation: Conversation
	allowEdit: boolean
}) => (
	<tr class="border-b dark:border-gray-700 text-sm">
		<td class="p-2">
			<span class="text-gray-800 dark:text-gray-300">
				{props.conversation.name}
			</span>
		</td>
		<td class="p-2">
			<span class="text-gray-600 dark:text-gray-400">
				{props.conversation.description}
			</span>
		</td>
		<td class="p-2">
			{props.conversation.tags.map((tag) => (
				<Chip value={tag} />
			))}
		</td>
		<td class="p-2">{props.conversation.once.toString()}</td>
		<td class="h-4 p-2 text-right">
			<Button
				id="edit-conversation-button"
				text="Edit"
				action={() => route(`/conversations/${props.conversation.id}/edit`)}
				type="text"
				class={`col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold ${
					props.allowEdit ? '' : 'hidden'
				}`}
			/>
		</td>
	</tr>
)

/**
 * The conversation list page.
 *
 * @prop {boolean} groot - Whether or not the user is Groot.
 *
 * @page
 */
export const ConversationListPage = (props: { groot: boolean }) => {
	// Define a state for error messages and conversations.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [conversations, setConversations] = useState<
		Conversation[] | undefined
	>(undefined)

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

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Conversations
					</h5>
					<Button
						id="create-conversation-button"
						text="Create"
						action={() => route('/conversations/create')}
						type="filled"
						class={props.groot ? 'block' : 'hidden'}
					/>
				</div>
				<LoadingIndicator isLoading={typeof conversations === 'undefined'} />
				<div
					class={`overflow-x-auto sm:rounded-lg ${
						typeof conversations === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase dark:text-gray-400 text-left">
							<tr>
								<th class="p-2">Name</th>
								<th class="p-2">Description</th>
								<th class="p-2">Tags</th>
								<th class="p-2">Once</th>
								<th class="p-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="p-4">
							{conversations?.map((conversation: Conversation) => (
								<ConversationItem
									conversation={conversation}
									allowEdit={props.groot}
								/>
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
