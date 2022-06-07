// source/pages/reports/edit.tsx
// Defines and exports the report edit page.

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
import { errors, messages } from '@/utilities/text'

import { Attribute, Report, DependentAttribute, User } from '@/api'
import { storage } from '@/utilities/storage'

/**
 * The form's state.
 */
type ReportFormState = Partial<Report>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type ReportEditFormAction =
	| {
			type: 'update-field'
			field: keyof Report
			payload?: any
	  }
	| {
			type: 'set-report'
			payload: Report
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

/**
 * The report edit page.
 *
 * @prop {string} reportId - The ID of the report to edit.
 *
 * @page
 */
export const ReportEditPage = (props: { reportId: string }) => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {ReportFormState} state - The current state of the form.
	 * @param {ReportEditFormAction} action - The action to perform.
	 */
	const reducer = (
		state: ReportFormState,
		action: ReportEditFormAction,
	): ReportFormState => {
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
			case 'set-report':
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

			default:
				return state
		}

		return state
	}

	// Edit the reducer.
	const [report, dispatch] = useReducer<ReportFormState, ReportEditFormAction>(
		reducer,
		{},
	)

	// Define a state for error and success messages.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [currentSuccess, setSuccessMessage] = useState<string | undefined>(
		undefined,
	)
	// This list of attributes used to fill the dropdown, so Groot can choose.
	const [attributes, setAttributes] = useState<Attribute[]>([])

	// Fetch the attributes using the API.
	useEffect(() => {
		const fetchReport = async (): Promise<Report> => {
			const response = await fetch<{ report: Report }>({
				url: `/reports/${props.reportId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.report
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

		const decodeReportContent = async (
			fetchedReport: Report,
			fetchedAttributes: Attribute[],
		): Promise<Report> => {
			// First, decode the code from its base64 form.
			fetchedReport.template = atob(fetchedReport.template)

			// Then, replace all the attribute IDs with attribute names.
			const attributeIdMatches = [
				...fetchedReport.template.matchAll(/(\w{28})/g),
			]
			for (const [_match, attributeId] of attributeIdMatches) {
				// Find the attribute.
				const attribute = fetchedAttributes.find(
					(attr) => attr.id === attributeId,
				)
				// If it does not exist, error out.
				if (!attribute) {
					throw new Error(
						errors.get('report-attribute-not-found') + attributeId,
					)
				}

				// Else replace the attribute name with the ID.
				fetchedReport.template = fetchedReport.template.replace(
					new RegExp(`"${attribute.id}"`, 'g'),
					`"{${attribute.name}}"`,
				)
			}

			return fetchedReport
		}

		Promise.all([fetchAttributes(), fetchReport()])
			.then(async ([fetchedAttributes, fetchedReport]) => {
				const decodedReport = await decodeReportContent(
					fetchedReport,
					fetchedAttributes,
				)
				dispatch({ type: 'set-report', payload: decodedReport })

				setAttributes(fetchedAttributes)
			})
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Update the report using the API.
	 */
	const saveReport = async () => {
		// Clear the error message.
		setErrorMessage(undefined)
		// Delete any blank attribute IDs from the report.
		report.input = report.input
			? report.input.filter((attr) => Boolean(attr.id))
			: []
		// Replace all attribute names with actual IDs in the report.
		const attributeNameMatches = [...report.template!.matchAll(/"{(.*?)}"/g)]
		// Keep a copy of the original incase an error is detected and we need to
		// abort.
		const originalContents = report.template
		for (const [_match, attributeName] of attributeNameMatches) {
			// Find the attribute.
			const attribute = attributes.find((attr) => attr.name === attributeName)
			// If it does not exist, error out and restore the report.
			if (!attribute) {
				report.template = originalContents
				return setErrorMessage(
					errors.get('report-attribute-not-found') + attributeName,
				)
			}

			// Else replace the attribute name with the ID.
			report.template = report.template!.replace(
				new RegExp(`"{${attribute.name}}"`, 'g'),
				`"${attribute.id}"`,
			)
		}

		// Base64 encode the report's templates.
		report.template = btoa(report.template!)

		// Make the API call to edit the report.
		const response = await fetch<{ report: Report }>({
			url: `/reports/${report.id}`,
			method: 'put',
			json: report,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)

		// Display a success message and make it disappear after 2.5 seconds.
		setSuccessMessage(messages.get('saved-report'))
		setTimeout(() => setSuccessMessage(undefined), 2500)
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Edit Report
					</h5>
				</div>
				<LoadingIndicator
					isLoading={
						typeof report === 'undefined' && currentError === undefined
					}
				/>
				<div class={typeof report === 'undefined' ? 'hidden' : ''}>
					<div class="overflow-x-auto sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="report-name"
									value={report?.name}
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
									type="report-tags"
									value={report?.tags?.join(', ')}
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
									type="report-description"
									value={report?.description}
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
									{(report?.input ?? []).map(({ id, optional }) => {
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
																payload: (report.input ?? []).filter(
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
									code={report.template!}
									language="html"
									update={(value: string) => {
										dispatch({
											type: 'update-field',
											field: 'template',
											payload: value,
										})
									}}
								/>
							</div>
						</div>
					</div>
					<div class="mt-4 grid grid-cols-6">
						<Button
							id="back-button"
							text="Back"
							action={() => route('/reports')}
							type="text"
							class="col-span-2 md:col-span-1 text-left"
						/>
						<div class="hidden md:block md:col-span-3"></div>
						<Button
							id="preview-report-button"
							text="Preview Report"
							action={() =>
								// Preview the report for the current user.
								window.open(
									`/users/${
										storage.get<User>('user')!.id
									}/reports/${report.id!}`,
								)
							}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="save-button"
							text="Save"
							action={async () => saveReport()}
							type="filled"
							class="col-span-2 md:col-span-1"
						/>
					</div>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
				<Toast id="success-message" type="error" text={currentSuccess} />
			</div>
		</PageWrapper>
	)
}
