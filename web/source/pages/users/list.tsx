// source/pages/users/list.tsx
// Defines and exports the user list page.

import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'

import { Button, Toast, LoadingIndicator, PageWrapper } from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'

import type { User } from '@/api'

/**
 * A item that shows a user in the list.
 *
 * @prop {User} user - The user to render.
 *
 * @component
 */
const UserItem = (props: { user: User }) => {
	const { user } = props

	return (
		<tr class="border-b dark:border-gray-700 text-sm">
			<td class="p-2">
				<span class="text-gray-800 dark:text-gray-300">{user.name}</span>
			</td>
			<td class="p-2">
				<span class="text-gray-600 dark:text-gray-400">{user.email}</span>
			</td>
			<td class="h-4 p-2 text-right">
				<Button
					id="view-user-button"
					text="View"
					action={() => route(`/users/${user.id}`)}
					type="text"
					class="col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold"
				/>
			</td>
		</tr>
	)
}

/**
 * The user list page.
 *
 * @page
 */
export const UserListPage = () => {
	// Define a state for error messages and users.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [users, setUsers] = useState<User[] | undefined>(undefined)

	// Fetch the users using the API.
	useEffect(() => {
		const fetchUsers = async (): Promise<User[]> => {
			const response = await fetch<{ users: User[] }>({
				url: '/users',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.users
		}

		fetchUsers()
			.then((users) =>
				// Sort the users in ascending order by the time they last signed in..
				users.sort(
					(a, b) =>
						new Date(a.lastSignedIn).valueOf() -
						new Date(b.lastSignedIn).valueOf(),
				),
			)
			.then(setUsers)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Users
					</h5>
				</div>
				<LoadingIndicator
					isLoading={
						typeof users === 'undefined' && typeof currentError === 'undefined'
					}
				/>
				<div
					class={`overflow-x-auto sm:rounded-lg ${
						typeof users === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase dark:text-gray-400 text-left">
							<tr>
								<th class="p-2">Name</th>
								<th class="p-2">Email</th>
								<th class="p-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="p-4">
							{users?.map((user: User) => (
								<UserItem user={user} />
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
