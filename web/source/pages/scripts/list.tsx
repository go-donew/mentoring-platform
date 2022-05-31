// source/pages/scripts/list.tsx
// Defines and exports the script list page.

import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Chip,
	Button,
	Toast,
	LoadingIndicator,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'

import type { Script, Attribute } from '@/api'

/**
 * A item that shows a script in the list.
 *
 * @prop {Script} script - The script to render.
 *
 * @component
 */
const ScriptItem = (props: { script: Script }) => {
	const [script, setScript] = useState<Script>(props.script)

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
			.catch((_error) => {})
	}, [])

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

		fetchScripts()
			.then(setScripts)
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
				<LoadingIndicator isLoading={typeof scripts === 'undefined'} />
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
								<ScriptItem script={script} />
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
