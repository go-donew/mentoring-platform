// source/pages/scripts/list.tsx
// Defines and exports the script list page.

import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Chip,
	Button,
	Checkbox,
	Toast,
	LoadingIndicator,
	Modal,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { messages } from '@/utilities/text'

import type { Script, Attribute, User } from '@/api'

/**
 * A item that shows a script in the list.
 *
 * @prop {Script} script - The script to render.
 * @prop {User[]} users - The users for whom the script can be run.
 *
 * @component
 */
const ScriptItem = (props: { script: Script; users: User[] }) => {
	// Define a state for the script and for the opening or closing of the user
	// list modal.
	const [script, setScript] = useState<Script>(props.script)
	const [userModalState, toggleModalState] = useState<boolean>(false)
	const [scriptSubjects, setScriptSubjects] = useState<string[]>([])
	// Define a state for error and success messages and the loading indicator.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [currentMessage, setSuccessMessage] = useState<string | undefined>(
		undefined,
	)
	const [isLoading, setIsLoading] = useState<boolean>(false)

	useEffect(() => {
		const fetchAttribute = async (
			id: string,
		): Promise<Attribute | undefined> => {
			const response = await fetch<{ attribute: Attribute }>({
				url: `/attributes/${id}`,
				method: 'get',
			})

			// If an error occurs, skip over.
			if (isErrorResponse(response)) return
			// And if there are none, return the data.
			return response.attribute
		}

		const replaceIds = async (): Promise<Script> => {
			// Replace the attribute IDs with the name.
			const inputAttributesById = script.input
			script.input = []
			for (const { id, optional } of inputAttributesById) {
				const attribute = await fetchAttribute(id)

				if (attribute)
					script.input.push({
						id: `${attribute.name} {${attribute.id}}`,
						optional,
					})
			}

			const computedAttributesById = script.computed
			script.computed = []
			for (const { id, optional } of computedAttributesById) {
				const attribute = await fetchAttribute(id)

				if (attribute)
					script.computed.push({
						id: `${attribute.name} {${attribute.id}}`,
						optional,
					})
			}

			return script
		}

		replaceIds()
			.then((script) =>
				setScript({
					...script,
				}),
			)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Run the script by making an API  call.
	 */
	const runScript = async (): Promise<void> => {
		// Clear the current messages.
		setErrorMessage(undefined)
		setSuccessMessage(undefined)
		// Display the loading indicator.
		setIsLoading(true)

		const response = await fetch({
			url: `/scripts/${script.id}/run`,
			method: 'put',
			json: {
				users: scriptSubjects,
			},
		})

		// Hide the loading indicator.
		setIsLoading(false)

		// If an error occurs, throw it.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)
		// And if there are none, show a success message.
		setSuccessMessage(
			messages.get('script-ran-successfully') +
				` (for ${scriptSubjects.length} users)`,
		)
	}

	return (
		<tr class="border-b dark:border-gray-700 text-sm">
			<td class="p-2">
				<span class="text-gray-800 dark:text-gray-300">{script.name}</span>
			</td>
			<td class="p-2">
				<span class="text-gray-600 dark:text-gray-400">
					{script.description}
				</span>
			</td>
			<td class="p-2">
				{script.tags.map((tag) => (
					<Chip value={tag} />
				))}
			</td>
			<td class="p-2">
				{script.input.map((attribute) => {
					// The ID string is packed with attribute info in the following
					// format: `<name> {<id>}`
					const attributeIdMatches = /{(.*?)}/.exec(attribute.id)
					const attributeId = attributeIdMatches
						? attributeIdMatches[1]
						: attribute.id
					const attributeName = attribute.id
						.replace(attributeId, '')
						.replace('{}', '')
						.trim()

					return (
						<>
							<a href={`/attributes/${attributeId}/edit`}>
								<span class="text-gray-900 dark:text-white">
									{attributeName}
								</span>
								{!attribute.optional && (
									<span class="text-error dark:text-error-dark">*</span>
								)}
							</a>
							<br />
						</>
					)
				})}
			</td>
			<td class="p-2">
				{script.computed.map((attribute) => {
					// The ID string is packed with attribute info in the following
					// format: `<name> {<id>}`
					const attributeIdMatches = /{(.*?)}/.exec(attribute.id)
					const attributeId = attributeIdMatches
						? attributeIdMatches[1]
						: attribute.id
					const attributeName = attribute.id
						.replace(attributeId, '')
						.replace('{}', '')
						.trim()

					return (
						<>
							<a href={`/attributes/${attributeId}/edit`}>
								<span class="text-gray-900 dark:text-white">
									{attributeName}
								</span>
								{!attribute.optional && (
									<span class="text-error dark:text-error-dark">*</span>
								)}
							</a>
							<br />
						</>
					)
				})}
			</td>
			<td class="h-4 p-2 text-right">
				<Button
					id="edit-script-button"
					text="Edit"
					action={() => route(`/scripts/${script.id}/edit`)}
					type="text"
					class="col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold"
				/>
				<Button
					id="run-script-button"
					text="Run"
					action={() => toggleModalState(true)}
					type="text"
					class="col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold"
				/>
				<Modal
					title="Select Users"
					description="Select a list of users for whom the script should run."
					isVisible={userModalState}
					toggleModal={toggleModalState}
				>
					{props.users.map((user) => (
						<Checkbox
							id="select-user"
							text={`${user.name} (${user.email})`}
							selected={scriptSubjects.includes(user.id)}
							action={(checked: boolean) => {
								setScriptSubjects(
									checked
										? [...scriptSubjects, user.id]
										: scriptSubjects.filter((id) => id !== user.id),
								)
							}}
							class="leading-none text-md text-gray-800 dark:text-gray-200 font-bold"
						/>
					))}
					<Button
						id="run-script-button"
						text="Run"
						action={async () => runScript()}
						type="filled"
						class={`mt-6 ${isLoading ? 'hidden' : 'block w-full'}`}
					/>
					<LoadingIndicator isLoading={isLoading} class="mt-6" />
					<Toast id="error-message" type="error" text={currentError} />
					<Toast id="success-message" type="info" text={currentMessage} />
				</Modal>
			</td>
		</tr>
	)
}

/**
 * The script list page.
 *
 * @page
 */
export const ScriptListPage = () => {
	// Define a state for error messages and scripts.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [scripts, setScripts] = useState<Script[] | undefined>(undefined)
	const [users, setUsers] = useState<User[]>([])

	// Fetch the scripts using the API.
	useEffect(() => {
		const fetchScripts = async (): Promise<Script[]> => {
			const response = await fetch<{ scripts: Script[] }>({
				url: '/scripts',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.scripts
		}

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

		fetchScripts()
			.then((scripts) =>
				// Sort the scripts in ascending order by their names.
				scripts.sort((a, b) => a.name.localeCompare(b.name)),
			)
			.then(setScripts)
			.catch((error) => setErrorMessage(error.message))

		fetchUsers()
			.then(setUsers)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Scripts
					</h5>
					<Button
						id="create-script-button"
						text="Create"
						action={() => route('/scripts/create')}
						type="filled"
					/>
				</div>
				<LoadingIndicator
					isLoading={
						typeof scripts === 'undefined' &&
						typeof currentError === 'undefined'
					}
				/>
				<div
					class={`overflow-x-auto sm:rounded-lg ${
						typeof scripts === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase dark:text-gray-400 text-left">
							<tr>
								<th class="p-2">Name</th>
								<th class="p-2">Description</th>
								<th class="p-2">Tags</th>
								<th class="p-2">Input</th>
								<th class="p-2">Computed</th>
								<th class="p-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="p-4">
							{scripts?.map((script: Script) => (
								<ScriptItem script={script} users={users} />
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
