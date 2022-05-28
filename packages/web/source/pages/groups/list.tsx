// source/pages/groups/list.tsx
// Defines and exports the group list page.

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

import type { User, Group } from '@/api'

const object = Object

/**
 * A item that shows a group in the list.
 *
 * @prop {Group} group - The group to render.
 * @prop {boolean} allowEdit - Whether to allow the user to edit a group.
 *
 * @component
 */
const GroupItem = (props: { group: Group; allowEdit: boolean }) => {
	const [group, setGroup] = useState<Group>(props.group)
	// Fetch the name and email of the users so we can display that instead of
	// their IDs.
	useEffect(() => {
		const fetchUser = async (id: string): Promise<User | undefined> => {
			const response = await fetch<{ user: User }>({
				url: `/users/${id}`,
				method: 'get',
			})

			// If an error occurs, skip over.
			if (isErrorResponse(response)) return
			// And if there are none, return the data.
			return response.user
		}

		const replaceIds = async (): Promise<Group> => {
			const participantsByIds = group.participants
			group.participants = {}

			// Replace the IDs with the name and email.
			for (const userId of Object.keys(participantsByIds)) {
				const user = await fetchUser(userId)

				if (user)
					group.participants[`${user.name} (${user.email}) {${user.id}}`] =
						participantsByIds[userId]
			}

			return group
		}

		replaceIds()
			.then((group) =>
				setGroup({
					...group,
				}),
			)
			.catch((_error) => {})
	}, [])

	return (
		<tr class="border-b dark:border-gray-700 text-sm">
			<td class="p-2">
				<span class="text-gray-800 dark:text-gray-300">{group.name}</span>
			</td>
			<td class="p-2">
				<span class="text-gray-600 dark:text-gray-400">{group.code}</span>
			</td>
			<td class="p-2">
				{group.tags.map((tag) => (
					<Chip value={tag} />
				))}
			</td>
			<td class="p-2">
				{object.entries(group.participants).map(([participant, role]) => {
					// The participants string is packed with user info in the following
					// format: `<name> (<email>) {<id>}`
					const userIdMatches = /{(.*?)}/.exec(participant)
					const userId = userIdMatches ? userIdMatches[1] : participant
					const userName = participant
						.replace(userId, '')
						.replace('{}', '')
						.trim()

					return (
						<>
							<a href={`/users/${userId}`}>
								<span class="text-gray-900 dark:text-white">{userName} </span>
								<span class="text-gray-500 dark:text-gray-400">{role}</span>
							</a>
							<br />
						</>
					)
				})}
			</td>
			<td class="h-4 p-2 text-right">
				<Button
					id="edit-group-button"
					text="Edit"
					action={() => route(`/groups/${group.id}/edit`)}
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
 * The group list page.
 *
 * @prop {boolean} groot - Whether or not the user is Groot.
 *
 * @page
 */
export const GroupListPage = (props: { groot: boolean }) => {
	// Define a state for error messages and groups.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [groups, setGroups] = useState<Group[] | undefined>(undefined)

	// Fetch the groups using the API.
	useEffect(() => {
		const fetchGroups = async (): Promise<Group[]> => {
			const response = await fetch<{ groups: Group[] }>({
				url: '/groups',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.groups
		}

		fetchGroups()
			.then(setGroups)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-4xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Groups
					</h5>
					<Button
						id="create-group-button"
						text="Create"
						action={() => route('/groups/create')}
						type="filled"
						class={props.groot ? 'block' : 'hidden'}
					/>
				</div>
				<LoadingIndicator isLoading={typeof groups === 'undefined'} />
				<div
					class={`overflow-x-auto sm:rounded-lg ${
						typeof groups === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase dark:text-gray-400 text-left">
							<tr>
								<th class="p-2">Name</th>
								<th class="p-2">Code</th>
								<th class="p-2">Tags</th>
								<th class="p-2">Participants</th>
								<th class="p-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="p-4">
							{groups?.map((group: Group) => (
								<GroupItem group={group} allowEdit={props.groot} />
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}