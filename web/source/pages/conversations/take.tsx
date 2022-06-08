// source/pages/conversations/take.tsx
// Defines and exports the take conversation page.

import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'
import { marked } from 'marked'
import { sanitize } from 'dompurify'

import {
	Button,
	RadioButton,
	ExpandableTextInput,
	Toast,
	LoadingIndicator,
	PageWrapper,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'

import type { Option, Question, Conversation } from '@/api'

/**
 * Render Markdown text as HTML.
 *
 * @param {string} text - The markdown text to convert to HTML.
 *
 * @returns {string} - The HTML.
 */
const renderMarkdown = (text: string): string => {
	const html = sanitize(marked.parse(text))
		.replace('<p>', '<span>')
		.replace('</p>', '</span>')

	return html
}

/**
 * An option for a question.
 *
 * @prop {Option} option - The option to render.
 * @prop {Function} update - The callback to call when the option is selected.
 *
 * @component
 */
const OptionItem = (props: {
	option: Option
	selected: boolean
	update: (option: Option) => void
}) => {
	const { option } = props

	return (
		<div class="col-span-6 my-1 p-3 rounded-lg border dark:bg-background-dark dark:border-gray-700 text-sm">
			{option.type === 'select' ? (
				<RadioButton
					id={`option-${option.position}`}
					text={renderMarkdown(option.text)}
					selected={props.selected}
					action={() => props.update(option)}
					class="leading-none text-md text-gray-800 dark:text-gray-300 font-bold"
				/>
			) : (
				<>
					<RadioButton
						id={`option-${option.position}`}
						text={option.text}
						selected={props.selected}
						action={() => {
							props.update(option)
						}}
						class="leading-none text-gray-800 dark:text-gray-400"
					/>
					<ExpandableTextInput
						id={`option-${option.position}`}
						type="user-answer-text"
						rows={3}
						update={(value: string) => {
							if (option.attribute) option.attribute.value = value
							props.update(option)
						}}
						focus={() => props.update(option)}
					/>
				</>
			)}
		</div>
	)
}

/**
 * The take conversation page.
 *
 * @prop {string} conversationId - The ID of the conversation the user wants to take.
 *
 * @page
 */
export const TakeConversationPage = (props: { conversationId: string }) => {
	// Define a state for error messages, the conversation and questions.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [conversation, setConversation] = useState<Conversation | undefined>(
		undefined,
	)
	const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>(
		undefined,
	)
	const [selectedOption, setSelectedOption] = useState<Option | undefined>(
		undefined,
	)

	// Fetch the conversation and questions using the API.
	useEffect(() => {
		const fetchConversation = async (): Promise<Conversation> => {
			const response = await fetch<{ conversation: Conversation }>({
				url: `/conversations/${props.conversationId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) {
				switch (response.error.code) {
					case 'not-allowed':
						throw new Error(errors.get('not-allowed-to-take-conversation'))
					default:
						throw new Error(response.error.message)
				}
			}

			// ...and if there are none, return the data.
			return response.conversation
		}

		const fetchQuestions = async (): Promise<Question[]> => {
			const response = await fetch<{ questions: Question[] }>({
				url: `/conversations/${props.conversationId}/questions`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) {
				switch (response.error.code) {
					case 'not-allowed':
						throw new Error(errors.get('not-allowed-to-take-conversation'))
					default:
						throw new Error(response.error.message)
				}
			}

			// ...and if there are none, return the data.
			return response.questions
		}

		fetchConversation()
			.then(setConversation)
			.catch((error) => setErrorMessage(error.message))

		fetchQuestions()
			.then((questions: Question[]) => {
				// Find the first question and render it.
				const firstQuestion = questions.find((question) => question.first)
				// If no first question exists, show an error.
				if (!firstQuestion)
					setErrorMessage(errors.get('first-question-not-found'))
				// Else set the question.
				setCurrentQuestion(firstQuestion)
			})
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Save the user's answer, and retrieve the next question.
	 */
	const answerQuestion = async () => {
		// Clear the error message., the current question and the current option.
		setErrorMessage(undefined)

		// If there is no option selected, return an error.
		if (!selectedOption)
			return setErrorMessage(errors.get('option-was-not-selected'))

		setCurrentQuestion(undefined)
		setSelectedOption(undefined)

		// Make the API call to answer the question and retrieve the next one.
		const response = await fetch<{ next?: Question }>({
			url: `/conversations/${conversation!.id}/questions/${
				currentQuestion!.id
			}/answer`,
			method: 'put',
			json: {
				position: selectedOption.position,
				input:
					selectedOption.type === 'select'
						? undefined
						: selectedOption.attribute!.value,
			},
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response))
			return setErrorMessage(response.error.message)

		// Set the next question.
		if (response.next) setCurrentQuestion(response.next)
		else route('/')
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="pb-1 leading-none text-xl text-gray-900 dark:text-white font-bold">
						{conversation?.name ?? 'Conversation'}
					</h5>
				</div>
				<LoadingIndicator
					isLoading={
						typeof currentQuestion === 'undefined' &&
						typeof currentError === 'undefined'
					}
				/>
				<div
					class={`sm:rounded-lg ${
						typeof currentQuestion === 'undefined' ? 'hidden' : 'block'
					}`}
				>
					{typeof currentQuestion !== 'undefined' && (
						<>
							<div class="grid grid-cols-6 gap-1">
								<div class="col-span-6 pb-4 pt-2">
									<div
										class="pb-4 border-b border-gray-900 dark:border-gray-600 text-md text-gray-900 dark:text-white unreset"
										dangerouslySetInnerHTML={{
											__html: renderMarkdown(currentQuestion.text),
										}}
									/>
								</div>
								{currentQuestion.options.map((option) => (
									<OptionItem
										option={option}
										selected={option.position === selectedOption?.position}
										update={setSelectedOption}
									/>
								))}
								<div class="block col-span-5"></div>
								<Button
									id="next-button"
									text={currentQuestion.last ? 'Finish' : 'Next'}
									action={async () => answerQuestion()}
									type="filled"
									class="col-span-1 mt-4"
								/>
							</div>
						</>
					)}
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
