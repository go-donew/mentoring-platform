// source/pages/scripts/create.tsx
// Defines and exports the script create page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Label,
	Button,
	IconButton,
	TextInput,
	CodeEditor,
	SelectInput,
	Toast,
	LoadingIndicator,
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
type ScriptFormState = Partial<Omit<Script, 'id'>>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type ScriptCreateFormAction =
	| {
			type: 'update-field'
			field: keyof Script
			payload?: any
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
 * An example script that Groot can edit.
 */
const exampleScript = `
-- scripts/example
-- An example script that calculates the score of a user in a quiz.

-- The computation of the attribute must be done in a \`compute\` function, that
-- is called with context.
function compute(context)
  -- The \`context.input\` variable contains the attributes requested as script as
  -- input. If the input attribute is required and not present, the script will
  -- not be run, so you can safely assume that the attribute exists. If the attribute
  -- is optional, it may or may not exist, please do a null check before using it.
	-- Each attribute contains the attribute ID, current value and attribute history,
	-- that you can use:
	-- - context.input[<ID>].id
	-- - context.input[<ID>].value
	-- - context.input[<ID>].history
	-- Instead of specifying the attribute ID, you could specify the name in curly
	-- brackets instead, and we will replace it with the ID of the attribute.

  -- The \`context.user\` variable contains information about the current user (name,
  -- email, user ID, etc.) that you can use:
  -- - context.user.id
	-- - context.user.name
	-- - context.user.email
	-- - context.user.lastSignedIn
  
  -- The score can be calculated by taking the average of their scores
  -- in the quiz.
  knowsCleanestCity = context.input["{Knows Cleanest City}"].value
  knowsCapitalCity = context.input["{Knows Capital City}"].value
  quizScore = (knowsCapitalCity + knowsCleanestCity) / 2
	quizScoreAsPercentage = quizScore * 100

  -- The returned object must be a lua table containing the user attributes to set.
  -- The attributes will be set on the user passed in as \`context.user\`.
  return {
    attributes = {
      ["{Quiz Score}"] = {
        value = quizScoreAsPercentage
      }
    }
  }
end
`.trim()

/**
 * The script create page.
 *
 * @page
 */
export const ScriptCreatePage = () => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {ScriptFormState} state - The current state of the form.
	 * @param {ScriptCreateFormAction} action - The action to perform.
	 */
	const reducer = (
		state: ScriptFormState,
		action: ScriptCreateFormAction,
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

	// Create the reducer.
	const [script, dispatch] = useReducer<
		ScriptFormState,
		ScriptCreateFormAction
	>(reducer, {
		content: exampleScript,
	})

	// Define a state for error messages, loading indicators and the list of attributes.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [isCreating, setIsCreating] = useState<boolean>(false)
	// This list of attributes used to fill the dropdown, so Groot can choose.
	const [attributes, setAttributes] = useState<Attribute[]>([])

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

	/**
	 * Create the script using the API.
	 */
	const createScript = async () => {
		// Clear the error message.
		setErrorMessage(undefined)
		setIsCreating(true)

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

				setIsCreating(false)
				setErrorMessage(
					errors.get('script-attribute-not-found') + attributeName,
				)

				return
			}

			// Else replace the attribute name with the ID.
			script.content = script.content!.replace(
				new RegExp(`"{${attribute.name}}"`, 'g'),
				`"${attribute.id}"`,
			)
		}

		// Base64 encode the script's contents.
		script.content = btoa(script.content!)

		// Make the API call to create the script.
		const response = await fetch<{ script: Script }>({
			url: '/scripts',
			method: 'post',
			json: script,
		})

		// Stop loading.
		setIsCreating(false)

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
						Create Script
					</h5>
				</div>
				<div>
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
									language="lua"
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
							text="Create"
							action={async () => createScript()}
							type="filled"
							class={isCreating ? 'hidden' : 'col-span-2 md:col-span-1'}
						/>
						<LoadingIndicator isLoading={isCreating} />
					</div>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
