// source/pages/reports/create.tsx
// Defines and exports the report create page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Button,
	IconButton,
	TextInput,
	SelectInput,
	Toast,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'

import type { Attribute, Report, DependentAttribute } from '@/api'

/**
 * The form's state.
 */
type ReportFormState = Partial<Omit<Report, 'id'>>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type ReportCreateFormAction =
	| {
			type: 'update-field'
			field: keyof Report
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

/**
 * An example report that Groot can edit.
 */
const exampleTemplate = `
<!--
  reports/example
  An example report that displays the score in a quiz.
-->

<!-- Declare the variables we are going to use -->
<% const quizScore = context.input["{Quiz Score}"].value %>
<% const knowsCapitalCity = context.input["{Knows Capital City}"]%>
<% const knowsCleanestCity = context.input["{Knows Cleanest City}"] %>

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Page description -->
    <title>DoNew Mentoring </title>
    <meta name="description" content="The DoNew Mentoring Platform" />
    
    <!-- Define the character set we use, as well as the default width. -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    
    <!-- Use the default page icons. -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />

    <!-- Load all the fonts we are going to use. -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />

    <!-- Load Tailwind. -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'media',
        theme: {
          fontFamily: {
            sans: ['Manrope', 'sans-serif'],
            serif: ['Manrope', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    </script>
  </head>
  <body class="dark font-sans">
    <div class="pt-10 min-h-screen bg-white dark:bg-[#13151a]">
      <div class="mx-auto p-8 max-w-7xl rounded-lg border dark:border-gray-700 dark:bg-[#1d2026]">
        <div class="rounded-lg">
          <h5 class="w-fit pb-1 leading-none border-b border-gray-900 dark:border-gray-600 text-gray-900 dark:text-white text-xl font-bold">
            Quiz Score
          </h5>
          <br />
          <span class="pt-4 text-gray-900 dark:text-white">
            Thanks for taking the quiz! Your final score is <strong><%= quizScore %>%</strong>.
          </span>
          <br />
          <span class="pt-4 text-gray-900 dark:text-white">
            <% if (quizScore > 80) { %>
              Well done!
            <% } else { %>
              Keep working hard!
            <% } %>
          </span>
        </div>
      </div>
    </div>
  </body>
</html>
`.trim()

/**
 * The report create page.
 *
 * @page
 */
export const ReportCreatePage = () => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {ReportFormState} state - The current state of the form.
	 * @param {ReportCreateFormAction} action - The action to perform.
	 */
	const reducer = (
		state: ReportFormState,
		action: ReportCreateFormAction,
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

	// Create the reducer.
	const [report, dispatch] = useReducer<
		ReportFormState,
		ReportCreateFormAction
	>(reducer, {})

	// Define a state for error messages and the list of attributes.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
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
	 * Create the report using the API.
	 */
	const createReport = async () => {
		// Clear the error message.
		setErrorMessage(undefined)
		// Delete any blank attribute IDs from the report.
		report.input = report.input
			? report.input.filter((attr) => Boolean(attr.id))
			: []
		// Set the default template for the report while creating it, and
		// let Groot change it on the edit page.
		report.template = btoa(exampleTemplate)

		// Make the API call to create the report.
		const response = await fetch<{ report: Report }>({
			url: '/reports',
			method: 'post',
			json: report,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)

		// Then route the attribute to the report edit page, so Groot can edit the
		// template.
		route(`/reports/${response.report.id}/edit`)
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Create Report
					</h5>
				</div>
				<div>
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
						</div>
					</div>
					<div class="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6 md:gap-6">
						<div class="hidden md:block md:col-span-4"></div>
						<Button
							id="back-button"
							text="Cancel"
							action={() => route('/reports')}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="create-button"
							text="Create"
							action={async () => createReport()}
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
