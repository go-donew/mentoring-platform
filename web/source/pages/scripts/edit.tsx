// source/pages/scripts/edit.tsx
// Defines and exports the script edit page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Label,
	Button,
	IconButton,
	TextInput,
	CodeEditor,
	SelectInput,
	LoadingIndicator,
	Toast,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'

import type {
	Attribute,
	Script,
	DependentAttribute,
	ComputedAttribute,
} from '@/api'

/**
 * The form's state.
 */
type ScriptFormState = Partial<Script>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type ScriptEditFormAction =
	| {
			type: 'update-field'
			field: keyof Script
			payload?: any
	  }
	| {
			type: 'set-script'
			payload: Script
	  }
	| {
			type: 'add-input-attribute'
	  }
	| {
			type: 'update-input-attribute'
			payload: DependentAttribute
	  }
	| {
			type: 'replace-input-attribute'
			payload: {
				existing: string
				new: string
				optional: boolean
			}
	  }
	| {
			type: 'add-computed-attribute'
	  }
	| {
			type: 'update-computed-attribute'
			payload: ComputedAttribute
	  }
	| {
			type: 'replace-computed-attribute'
			payload: {
				existing: string
				new: string
				optional: boolean
			}
	  }

/**
 * The script edit page.
 *
 * @prop {string} scriptId - The ID of the script to edit.
 *
 * @page
 */
export const ScriptEditPage = (props: { scriptId: string }) => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {ScriptFormState} state - The current state of the form.
	 * @param {ScriptEditFormAction} action - The action to perform.
	 */
	const reducer = (
		state: ScriptFormState,
		action: ScriptEditFormAction,
	): ScriptFormState => {
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
			case 'set-script':
				return action.payload
			case 'add-input-attribute':
				return {
					...state,
					input: [
						...(state.input ?? []),
						{
							id: '',
							optional: false,
						},
					],
				}
			case 'update-input-attribute':
				return {
					...state,
					input: (state.input ?? []).map((attr) =>
						attr.id === action.payload.id ? action.payload : attr,
					),
				}

			case 'replace-input-attribute': {
				const updatedAttributes = (state.input ?? []).filter(
					(attr) => attr.id !== action.payload.existing,
				)

				updatedAttributes.push({
					id: action.payload.new,
					optional: action.payload.optional,
				})

				return {
					...state,
					input: updatedAttributes,
				}
			}

			case 'add-computed-attribute':
				return {
					...state,
					computed: [
						...(state.computed ?? []),
						{
							id: '',
							optional: false,
						},
					],
				}
			case 'update-computed-attribute':
				return {
					...state,
					computed: (state.computed ?? []).map((attr) =>
						attr.id === action.payload.id ? action.payload : attr,
					),
				}

			case 'replace-computed-attribute': {
				const updatedAttributes = (state.computed ?? []).filter(
					(attr) => attr.id !== action.payload.existing,
				)

				updatedAttributes.push({
					id: action.payload.new,
					optional: action.payload.optional,
				})

				return {
					...state,
					computed: updatedAttributes,
				}
			}

			default:
				return state
		}

		return state
	}

	// Edit the reducer.
	const [script, dispatch] = useReducer<ScriptFormState, ScriptEditFormAction>(
		reducer,
		{},
	)

	// Define a state for error messages and the list of attributes.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	// This list of attributes used to fill the dropdown, so Groot can choose.
	const [attributes, setAttributes] = useState<Attribute[]>([])

	// Fetch the attributes using the API.
	useEffect(() => {
		const fetchScript = async (): Promise<Script> => {
			const response = await fetch<{ script: Script }>({
				url: `/scripts/${props.scriptId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.script
		}

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

		const decodeScriptContent = async (
			fetchedScript: Script,
			fetchedAttributes: Attribute[],
		): Promise<Script> => {
			// First, decode the code from its base64 form.
			fetchedScript.content = atob(fetchedScript.content)

			// Then, replace all the attribute IDs with attribute names.
			const attributeIdMatches = [
				...fetchedScript.content.matchAll(/(\w{28})/g),
			]
			for (const [_match, attributeId] of attributeIdMatches) {
				// Find the attribute.
				const attribute = fetchedAttributes.find(
					(attr) => attr.id === attributeId,
				)
				// If it does not exist, error out.
				if (!attribute) {
					throw new Error(
						errors.get('script-attribute-not-found') + attributeId,
					)
				}

				// Else replace the attribute name with the ID.
				fetchedScript.content = fetchedScript.content.replace(
					new RegExp(`"${attribute.id}"`, 'g'),
					`"{${attribute.name}}"`,
				)
			}

			return fetchedScript
		}

		Promise.all([fetchAttributes(), fetchScript()])
			.then(async ([fetchedAttributes, fetchedScript]) => {
				const decodedScript = await decodeScriptContent(
					fetchedScript,
					fetchedAttributes,
				)
				dispatch({ type: 'set-script', payload: decodedScript })

				setAttributes(fetchedAttributes)
			})
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Update the script using the API.
	 */
	const saveScript = async () => {
		// Clear the error message.
		setErrorMessage(undefined)
		// Delete any blank attribute IDs from the script.
		script.input = script.input
			? script.input.filter((attr) => Boolean(attr.id))
			: []
		script.computed = script.computed
			? script.computed.filter((attr) => Boolean(attr.id))
			: []
		// Replace all attribute names with actual IDs in the script.
		const attributeNameMatches = [...script.content!.matchAll(/"{(.*?)}"/g)]
		// Keep a copy of the original incase an error is detected and we need to
		// abort.
		const originalContents = script.content
		for (const [_match, attributeName] of attributeNameMatches) {
			// Find the attribute.
			const attribute = attributes.find((attr) => attr.name === attributeName)
			// If it does not exist, error out and restore the script.
			if (!attribute) {
				script.content = originalContents
				return setErrorMessage(
					errors.get('script-attribute-not-found') + attributeName,
				)
			}

			// Else replace the attribute name with the ID.
			script.content = script.content!.replace(
				new RegExp(`"{${attribute.name}}"`, 'g'),
				`"${attribute.id}"`,
			)
		}

		// Base64 encode the script's contents.
		script.content = btoa(script.content!)

		// Make the API call to edit the script.
		const response = await fetch<{ script: Script }>({
			url: `/scripts/${script.id}`,
			method: 'put',
			json: script,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)

		// Then route the attribute to the script list page.
		route('/scripts')
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Edit Script
					</h5>
				</div>
				<LoadingIndicator
					isLoading={
						typeof script === 'undefined' && currentError === undefined
					}
				/>
				<div class={typeof script === 'undefined' ? 'hidden' : ''}>
					<div class="overflow-x-auto sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="script-name"
									value={script?.name}
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
									type="script-tags"
									value={script?.tags?.join(', ')}
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
									type="script-description"
									value={script?.description}
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
										<th class="text-left font-medium">Input Attribute</th>
										<th class="text-left font-medium">Optional</th>
										<th class="text-right">
											<IconButton
												id="add-input-attribute-button"
												action={() =>
													dispatch({
														type: 'add-input-attribute',
													})
												}
												icon="add"
											/>
										</th>
									</tr>
								</thead>
								<tbody>
									{(script?.input ?? []).map(({ id, optional }) => {
										return (
											<tr>
												<td class="pr-3">
													<SelectInput
														id="input-attribute-id"
														options={attributes.map((attribute) => {
															return {
																text: `${attribute.name}`,
																value: attribute.id,
															}
														})}
														selected={id}
														update={(selectedValue: string) => {
															dispatch({
																type: 'replace-input-attribute',
																payload: {
																	existing: id,
																	new: selectedValue,
																	optional,
																},
															})

															id = selectedValue
														}}
													/>
												</td>
												<td class="pr-3">
													<SelectInput
														id="input-attribute-optional"
														options={[
															{ text: 'No', value: 'false' },
															{ text: 'Yes', value: 'true' },
														]}
														selected={optional ? 'true' : 'false'}
														update={(selectedValue: string) => {
															dispatch({
																type: 'update-input-attribute',
																payload: {
																	id,
																	optional: selectedValue !== 'false',
																},
															})
														}}
													/>
												</td>
												<td class="pr-1 text-right">
													<IconButton
														id="remove-input-button"
														action={() => {
															dispatch({
																type: 'update-field',
																field: 'input',
																payload: (script.input ?? []).filter(
																	(attr) => attr.id !== id,
																),
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
							<table class="col-span-6">
								<thead>
									<tr class="text-sm text-gray-700 dark:text-gray-300">
										<th class="text-left font-medium">Computed Attribute</th>
										<th class="text-left font-medium">Optional</th>
										<th class="text-right">
											<IconButton
												id="add-computed-attribute-button"
												action={() =>
													dispatch({
														type: 'add-computed-attribute',
													})
												}
												icon="add"
											/>
										</th>
									</tr>
								</thead>
								<tbody>
									{(script?.computed ?? []).map(({ id, optional }) => {
										return (
											<tr>
												<td class="pr-3">
													<SelectInput
														id="computed-attribute-id"
														options={attributes.map((attribute) => {
															return {
																text: `${attribute.name}`,
																value: attribute.id,
															}
														})}
														selected={id}
														update={(selectedValue: string) => {
															dispatch({
																type: 'replace-computed-attribute',
																payload: {
																	existing: id,
																	new: selectedValue,
																	optional,
																},
															})

															id = selectedValue
														}}
													/>
												</td>
												<td class="pr-3">
													<SelectInput
														id="computed-attribute-optional"
														options={[
															{ text: 'No', value: 'false' },
															{ text: 'Yes', value: 'true' },
														]}
														selected={optional ? 'true' : 'false'}
														update={(selectedValue: string) => {
															dispatch({
																type: 'update-computed-attribute',
																payload: {
																	id,
																	optional: selectedValue !== 'false',
																},
															})
														}}
													/>
												</td>
												<td class="pr-1 text-right">
													<IconButton
														id="remove-computed-button"
														action={() => {
															dispatch({
																type: 'update-field',
																field: 'computed',
																payload: (script.computed ?? []).filter(
																	(attr) => attr.id !== id,
																),
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
							<div class="col-span-6">
								<Label for="code-input" text="Code" required={true} />
								<CodeEditor
									id="code-input"
									code={script.content!}
									update={(value: string) => {
										dispatch({
											type: 'update-field',
											field: 'content',
											payload: value,
										})
									}}
								/>
							</div>
						</div>
					</div>
					<div class="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6 md:gap-6">
						<div class="hidden md:block md:col-span-4"></div>
						<Button
							id="back-button"
							text="Cancel"
							action={() => route('/scripts')}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="save-button"
							text="Save"
							action={async () => saveScript()}
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
