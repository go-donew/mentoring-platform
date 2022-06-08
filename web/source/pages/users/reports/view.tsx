// source/pages/users/reports/view.tsx
// Defines and exports the view user report page.

import { useState, useEffect } from 'preact/hooks'

import { Toast, LoadingIndicator, PageWrapper } from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'

/**
 * The view user report page.
 *
 * @prop {string} userId - The ID of the user for whom to render the report.
 * @prop {string} reportId - The ID of the report to render.
 *
 * @page
 */
export const ViewUserReportPage = (props: {
	userId: string
	reportId: string
}) => {
	// Define a state for error messages and the list of users.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)

	// Fetch the report to render using the API.
	useEffect(() => {
		const fetchReport = async (): Promise<string> => {
			const response = await fetch<string>({
				url: `/users/${props.userId}/reports/${props.reportId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) {
				switch (response.error.code) {
					case 'precondition-failed':
						throw new Error(errors.get('report-not-generated'))
					default:
						throw new Error(response.error.message)
				}
			}

			// ...and if there are none, return the data.
			return response
		}

		fetchReport()
			.then((report) => {
				// Set the document's HTML to the decoded report.
				document.open()
				document.write(report)
				document.close()
			})
			.catch((error) => setErrorMessage(error.message))
	}, [])

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<LoadingIndicator isLoading={typeof currentError === 'undefined'} />
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
