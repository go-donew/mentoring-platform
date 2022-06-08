// source/pages/reports/list.tsx
// Defines and exports the report list page.

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
import { storage } from '@/utilities/storage'

import type { User, Report, Attribute } from '@/api'

/**
 * A item that shows a report in the list.
 *
 * @prop {Report} report - The report to render.
 * @prop {boolean} groot - Whether or not the user can edit the report.
 *
 * @component
 */
const ReportItem = (props: { report: Report; groot: boolean }) => {
	// Define a state for the report.
	const [report, setReport] = useState<Report>(props.report)

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

		const replaceIds = async (): Promise<Report> => {
			// Replace the attribute IDs with the name.
			const inputAttributesById = report.input
			report.input = []
			for (const { id, optional } of inputAttributesById) {
				const attribute = await fetchAttribute(id)

				if (attribute)
					report.input.push({
						id: `${attribute.name} {${attribute.id}}`,
						optional,
					})
			}

			return report
		}

		replaceIds()
			.then((report) =>
				setReport({
					...report,
				}),
			)
			.catch((_error) => {})
	}, [])

	return (
		<tr class="border-b dark:border-gray-700 text-sm">
			<td class="p-2">
				<span class="text-gray-800 dark:text-gray-300">{report.name}</span>
			</td>
			<td class="p-2">
				<span class="text-gray-600 dark:text-gray-400">
					{report.description}
				</span>
			</td>
			{props.groot && (
				<>
					<td class="p-2">
						{report.tags.map((tag) => (
							<Chip value={tag} />
						))}
					</td>
					<td class="p-2">
						{report.input.map((attribute) => {
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
				</>
			)}
			<td class="h-4 p-2 text-right">
				<Button
					id="view-report-button"
					text="View"
					action={() =>
						route(
							`/users/${storage.get<User>('user')!.id}/reports/${report.id}`,
						)
					}
					type="text"
					class="col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold"
				/>
				<Button
					id="edit-report-button"
					text="Edit"
					action={() => route(`/reports/${report.id}/edit`)}
					type="text"
					class={`col-span-1 w-fit text-secondary dark:text-secondary-dark font-semibold ${
						props.groot ? '' : 'hidden'
					}`}
				/>
			</td>
		</tr>
	)
}

/**
 * The report list page.
 *
 * @prop {boolean} groot - Whether or not the user viewing the page is Groot.
 *
 * @page
 */
export const ReportListPage = (props: { groot: boolean }) => {
	// Define a state for error messages and reports.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [reports, setReports] = useState<Report[] | undefined>(undefined)

	// Fetch the reports using the API.
	useEffect(() => {
		const fetchReports = async (): Promise<Report[]> => {
			const response = await fetch<{ reports: Report[] }>({
				url: '/reports',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.reports
		}

		fetchReports()
			.then((reports) =>
				// Sort the reports in ascending order by their names.
				reports.sort((a, b) => a.name.localeCompare(b.name)),
			)
			.then(setReports)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Reports
					</h5>
					<Button
						id="create-report-button"
						text="Create"
						action={() => route('/reports/create')}
						type="filled"
						class={props.groot ? 'block' : 'hidden'}
					/>
				</div>
				<LoadingIndicator
					isLoading={
						typeof reports === 'undefined' &&
						typeof currentError === 'undefined'
					}
				/>
				<div
					class={`overflow-x-auto sm:rounded-lg ${
						typeof reports === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					<table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase dark:text-gray-400 text-left">
							<tr>
								<th class="p-2">Name</th>
								<th class="p-2">Description</th>
								{props.groot && (
									<>
										<th class="p-2">Tags</th>
										<th class="p-2">Input</th>
									</>
								)}
								<th class="p-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="p-4">
							{reports?.map((report: Report) => (
								<ReportItem report={report} groot={props.groot} />
							))}
						</tbody>
					</table>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
