// source/pages/conversations/edit.tsx
// Defines and exports the conversation edit page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Label,
	Button,
	TextInput,
	ExpandableTextInput,
	SelectInput,
	Toast,
	LoadingIndicator,
	PageWrapper,
	IconButton,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors, messages } from '@/utilities/text'

import type { Attribute, Conversation, Question, Option, Script } from '@/api'

/**
 * The form's state.
 */
type ConversationFormState = Partial<Conversation>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type ConversationEditFormAction =
	| {
			type: 'update-field'
			field: keyof Conversation
			payload?: any
	  }
	| {
			type: 'set-conversation'
			payload: Conversation
	  }
/**
 * A question form's state.
 */
type QuestionFormState = Question | Omit<Question, 'id'>

/**
 * The conversation edit page.
 *
 * @prop {string} conversationId - The ID of the conversation to edit.
 *
 * @page
 */
export const ConversationEditPage = (props: { conversationId: string }) => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {ConversationFormState} state - The current state of the form.
	 * @param {ConversationEditFormAction} action - The action to perform.
	 */
	const conversationEditHandler = (
		state: ConversationFormState,
		action: ConversationEditFormAction,
	): ConversationFormState => {
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
			case 'set-conversation':
				return action.payload
			default:
				return state
		}

		return state
	}

	// Create the reducer for the conversation.
	const [conversation, handleConversationEdit] = useReducer<
		ConversationFormState,
		ConversationEditFormAction
	>(conversationEditHandler, {})
	// Define the state for the list of questions.
	const [questions, setQuestions] = useState<QuestionFormState[]>([])

	// Define a state for error and success messages.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	const [currentSuccess, setSuccessMessage] = useState<string | undefined>(
		undefined,
	)
	const [isSaving, setIsLoading] = useState<boolean>(false)
	// This list of attributes, scripts, and conversations used to fill the
	// dropdown, so Groot can choose which attribute to set when a question
	// is answered.
	const [attributes, setAttributes] = useState<Attribute[]>([])
	const [scripts, setScripts] = useState<Script[]>([])
	const [conversations, setConversations] = useState<Conversation[]>([])

	// Fetch the conversation and the attributes using the API.
	useEffect(() => {
		const fetchConversation = async (): Promise<Conversation> => {
			const response = await fetch<{ conversation: Conversation }>({
				url: `/conversations/${props.conversationId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.conversation
		}

		const fetchConversations = async (): Promise<Conversation[]> => {
			const response = await fetch<{ conversations: Conversation[] }>({
				url: `/conversations`,
				method: 'get',
				cache: true,
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.conversations
		}

		const fetchQuestions = async (): Promise<Question[]> => {
			const response = await fetch<{ questions: Question[] }>({
				url: `/conversations/${props.conversationId}/questions`,
				method: 'get',
				query: { raw: 'true' },
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.questions
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

		Promise.all([
			fetchConversation(),
			fetchConversations(),
			fetchQuestions(),
			fetchAttributes(),
			fetchScripts(),
		])
			.then(([conversation, conversations, questions, attributes, scripts]) => {
				handleConversationEdit({
					type: 'set-conversation',
					payload: conversation,
				})

				setConversations(conversations)
				setQuestions(questions)
				setAttributes(attributes)
				setScripts(scripts)
			})
			.catch((error) => setErrorMessage(error.message))
	}, [currentSuccess]) // Refresh these lists when the save button is pressed.

	/**
	 * Delete the conversation using the API.
	 */
	const deleteConversation = async (): Promise<void> => {
		// Clear the error message.
		setErrorMessage(undefined)
		setIsLoading(true)

		// Make the API call to delete the conversation.
		const response = await fetch({
			url: `/conversations/${conversation.id}`,
			method: 'delete',
		})

		// Stop loading.
		setIsLoading(false)

		// Handle any errors that might arise.
		if (isErrorResponse(response)) {
			const { error } = response

			switch (error.code) {
				case 'entity-not-found':
					setErrorMessage(errors.get('conversation-does-not-exist'))
					break
				default:
					setErrorMessage(error.message)
			}

			return
		}

		// Then route the user to the conversation list page.
		route('/conversations')
	}

	/**
	 * Delete a question using the API.
	 */
	const deleteQuestion = async (question: Question): Promise<void> => {
		// Clear the error message.
		setErrorMessage(undefined)
		setIsLoading(true)

		// Make the API call to delete the question.
		const response = await fetch({
			url: `/conversations/${conversation.id}/questions/${question.id}`,
			method: 'delete',
		})

		// Stop loading.
		setIsLoading(false)

		// Handle any errors that might arise.
		if (isErrorResponse(response)) {
			const { error } = response

			switch (error.code) {
				case 'entity-not-found':
					setErrorMessage(errors.get('question-does-not-exist'))
					break
				default:
					setErrorMessage(error.message)
			}
		}
	}

	/**
	 * Update the conversation using the API.
	 */
	const saveConversation = async (): Promise<void> => {
		// Clear the error message.
		setErrorMessage(undefined)
		setIsLoading(true)

		// Make the API call to update the conversation.
		const conversationResponse = await fetch<{ conversation: Conversation }>({
			url: `/conversations/${conversation.id}`,
			method: 'put',
			json: conversation,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(conversationResponse)) {
			const { error } = conversationResponse

			switch (error.code) {
				case 'entity-not-found':
					setErrorMessage(errors.get('conversation-does-not-exist'))
					break
				default:
					setErrorMessage(error.message)
			}

			setIsLoading(false)
			return
		}

		// Make the API calls to save the questions.
		const updatedQuestions = []
		// First, check that there is a first question to the conversation.
		if (!questions.some((question) => question.first)) {
			setErrorMessage(errors.get('first-question-not-found'))
			setIsLoading(false)

			return
		}

		// Else continue onto saving the questions.
		for (const question of questions) {
			// Remove unnecessary fields like `next` and `attribute` from options if
			// either of the values in them have been left blank.
			for (const option of question.options) {
				if (
					(option.attribute?.id === '' || option.attribute?.value === '') &&
					option.type === 'select'
				)
					delete option.attribute
				if (option.next?.conversation === '' || option.next?.question === '')
					delete option.next
			}

			// Replace all attribute names with actual IDs in the question.
			const attributeNameMatches = [...question.text.matchAll(/"{(.*?)}"/g)]
			// Keep a copy of the original incase an error is detected and we need to
			// abort.
			const originalContents = question.text
			for (const [_match, attributeName] of attributeNameMatches) {
				// Find the attribute.
				const attribute = attributes.find((attr) => attr.name === attributeName)
				// If it does not exist, error out and restore the question.
				if (!attribute) {
					question.text = originalContents

					setErrorMessage(
						errors.get('question-attribute-not-found') + attributeName,
					)
					setIsLoading(false)

					return
				}

				// Else replace the attribute name with the ID.
				question.text = question.text.replace(
					new RegExp(`"{${attribute.name}}"`, 'g'),
					`"${attribute.id}"`,
				)
			}

			const response =
				typeof (question as Question).id === 'undefined'
					? await fetch<{ question: Question }>({
							url: `/conversations/${conversation.id}/questions`,
							method: 'post',
							json: question,
					  })
					: await fetch<{ question: Question }>({
							url: `/conversations/${conversation.id}/questions/${
								(question as Question).id
							}`,
							method: 'put',
							json: question,
					  })

			// Handle any errors that might arise.
			if (isErrorResponse(response)) {
				setErrorMessage(
					errors.get('could-not-save-question') + ' ' + response.error.message,
				)

				continue
			}

			// Update the current state.
			updatedQuestions.push(response.question)
		}

		// Re-set the questions so they all have IDs (if they were newly created).
		setQuestions(updatedQuestions)

		// Stop loading.
		setIsLoading(false)

		// Show a success toast, and make it disappear after a 2.5 seconds.
		setSuccessMessage(messages.get('saved-conversation'))
		setTimeout(() => setSuccessMessage(undefined), 2500)
	}

	/**
	 * An option presented as an answer to a question.
	 *
	 * @prop {Option} option - The option.
	 * @prop {Function} save - The callback fired when the option is updated.
	 * @prop {Function} delete - The callback fired when the option is to be deleted.
	 *
	 * @component
	 */
	const Option = (props: {
		option: Option
		save: (option: Option) => void
		delete: () => void
		duplicate: () => void
	}) => {
		const { option } = props

		// Define a state for the list of possible next questions.
		const [possibleNextQuestions, setPossibleNextQuestions] = useState<
			Question[]
		>([])

		/**
		 * Fetch a list of questions that are a part of a conversation, that could
		 * be the next question.
		 *
		 * @param {string} conversationId - The ID of the conversation.
		 * @param {boolean} useCache - Whether or not to use cache.
		 *
		 * @returns {Question[]}
		 */
		const fetchPossibleNextQuestions = async (
			conversationId: string,
			useCache = false,
		): Promise<Question[]> => {
			// Return a blank array if the conversation chosen is 'None'.
			if (conversationId === '') return []
			// If the conversation chosen is the current one, just return the questions list.
			if (conversationId === conversation.id)
				return questions.filter(
					(form) => typeof (form as Question).id !== 'undefined',
				) as Question[]

			const response = await fetch<{ questions: Question[] }>({
				url: `/conversations/${conversationId}/questions`,
				method: 'get',
				query: { raw: 'true' },
				cache: useCache,
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.questions
		}

		useEffect(() => {
			// Fetch the list of possible questions for the currently selected
			// conversation.
			fetchPossibleNextQuestions(option.next?.conversation ?? '', true)
				.then(setPossibleNextQuestions)
				.catch((error) => setErrorMessage(error.message))
		}, [option.next?.conversation])

		return (
			<div class="col-span-6 sm:col-span-3 grid grid-cols-4 rounded-lg border dark:bg-background-dark dark:border-gray-700 gap-2 p-4">
				<span class="col-span-3 pt-1 font-medium leading-none text-sm text-gray-900 dark:text-white">
					Option {option.position}
				</span>
				<div class="col-span-1 text-right">
					<IconButton
						id="duplicate-option-button"
						action={() => props.duplicate()}
						icon="duplicate"
						class="w-fit text-gray-700 dark:text-gray-400 mr-2"
					/>
					<IconButton
						id="remove-option-button"
						action={() => props.delete()}
						icon="remove"
						class="w-fit text-gray-700 dark:text-gray-400"
					/>
				</div>
				<div class="col-span-4 mt-1">
					<Label for="text-input" text="Text" required={true} />
					<ExpandableTextInput
						id="text-input"
						type="option-text"
						value={option.text}
						required={true}
						update={(value: string) =>
							props.save({
								...option,
								text: value,
							})
						}
					/>
				</div>
				<div class="col-span-4 sm:col-span-2">
					<Label for="type-input" text="Type" required={true} />
					<SelectInput
						id="type-input"
						options={[
							{ text: 'Radio button', value: 'select' },
							{ text: 'User input', value: 'input' },
						]}
						selected={option.type}
						update={(value: string) => {
							props.save({
								...option,
								type: value as 'select' | 'input',
							})
						}}
					/>
				</div>
				<div class="col-span-4 sm:col-span-2">
					<TextInput
						id="position-input"
						label="Position"
						type="number"
						value={option.position.toString()}
						required={true}
						minimum={1}
						update={(value: string) =>
							props.save({
								...option,
								position: Number.parseInt(value, 10),
							})
						}
					/>
				</div>
				<div class="col-span-4 sm:col-span-2">
					<Label for="attribute-id-input" text="Attribute" required={false} />
					<SelectInput
						id="attribute-id-input"
						options={[
							{ text: 'None', value: '' },
							...attributes.map((attr) => {
								return {
									text: attr.name,
									value: attr.id,
								}
							}),
						]}
						selected={option.attribute?.id}
						update={(value: string) => {
							props.save({
								...option,
								attribute: { id: value, value: option.attribute?.value ?? '' },
							})
						}}
					/>
				</div>
				<div class="col-span-4 sm:col-span-2">
					{option.type === 'select' && (
						<TextInput
							id="attribute-value-input"
							label="Value"
							type="text"
							value={option.attribute?.value?.toString()}
							update={(value: string) => {
								// Remove the attribute if the value is set to blank.
								const id = value === '' ? '' : option.attribute!.id
								// Check if the value is a boolean or a number or a string, and
								// save it accordingly.
								let castValue: string | number | boolean = value
								if (Number.isNaN(Number(castValue)))
									castValue = Number.parseFloat(castValue)
								else if (castValue === 'true' || castValue === 'false')
									castValue = castValue === 'true'

								props.save({
									...option,
									attribute: { id, value },
								})
							}}
						/>
					)}
				</div>
				<div class="col-span-4">
					<Label for="script-input" text="Script To Run" required={false} />
					<SelectInput
						id="script-input"
						options={[
							{ text: 'None', value: '' },
							...(scripts?.map((script) => {
								return {
									text: script.name,
									value: script.id,
								}
							}) ?? []),
						]}
						selected={option.script}
						update={(value: string) => {
							props.save({
								...option,
								script: value,
							})
						}}
					/>
				</div>
				<div class="col-span-4 sm:col-span-2">
					<Label
						for="next-conversation-input"
						text="Next Conversation"
						required={false}
					/>
					<SelectInput
						id="next-conversation-input"
						options={[
							{ text: 'None', value: '' },
							...(conversations?.map((convo) => {
								return {
									text: convo.name,
									value: convo.id,
								}
							}) ?? []),
						]}
						selected={option.next?.conversation}
						update={(value: string) => {
							props.save({
								...option,
								next: {
									conversation: value,
									question: '',
								},
							})
						}}
					/>
				</div>
				<div class="col-span-4 sm:col-span-2">
					<Label for="question-input" text="Next Question" required={false} />
					<SelectInput
						id="next-question-input"
						options={[
							{ text: 'None', value: '' },
							...(possibleNextQuestions?.map((ques) => {
								return {
									text: ques.text,
									value: ques.id,
								}
							}) ?? []),
						]}
						selected={option.next?.question}
						update={(value: string) => {
							props.save({
								...option,
								next: {
									conversation: option.next!.conversation,
									question: value,
								},
							})
						}}
					/>
				</div>
			</div>
		)
	}

	/**
	 * A question that is part of the conversation.
	 *
	 * @prop {Question} question - The question.
	 * @prop {number} number - The question number.
	 * @prop {Function} save - The callback fired when the question is updated.
	 * @prop {Function} delete - The callback fired when the option is to be deleted.
	 *
	 * @component
	 */
	const Question = (props: {
		question: QuestionFormState
		number: number
		save: (question: QuestionFormState) => void
		delete: () => void
	}) => {
		const [question, setQuestion] = useState<QuestionFormState>(props.question)

		// Replace the attribute IDs with their names in the question text.
		useEffect(() => {
			const decodeQuestionText = async (
				questionForm: QuestionFormState,
			): Promise<QuestionFormState> => {
				// Replace all the attribute IDs with attribute names.
				const attributeIdMatches = [
					...questionForm.text.matchAll(/"(\w{28})"/g),
				]
				for (const [_match, attributeId] of attributeIdMatches) {
					// Find the attribute.
					const attribute = attributes.find((attr) => attr.id === attributeId)
					// If it does not exist, error out.
					if (!attribute) {
						throw new Error(
							errors.get('report-attribute-not-found') + attributeId,
						)
					}

					// Else replace the attribute name with the ID.
					questionForm.text = questionForm.text.replace(
						new RegExp(`"${attribute.id}"`, 'g'),
						`"{${attribute.name}}"`,
					)
				}

				return questionForm
			}

			decodeQuestionText(question)
				.then(setQuestion)
				.catch((error) => setErrorMessage(error.message))
		})

		return (
			<>
				<hr class="col-span-6 dark:border-gray-700" />
				<h6 class="col-span-5 text-md font-medium leading-none text-gray-900 dark:text-white">
					Question {props.number}
				</h6>
				<div class="col-span-1 text-right">
					<IconButton
						id="remove-question-button"
						action={() => props.delete()}
						icon="remove"
						class="w-fit text-gray-700 dark:text-gray-400"
					/>
				</div>
				<div class="col-span-6">
					<ExpandableTextInput
						id="text-input"
						type="question-text"
						value={question.text}
						rows={4}
						required={true}
						update={(value: string) =>
							props.save({
								...question,
								text: value,
							})
						}
					/>
				</div>
				<div class="col-span-6">
					<TextInput
						id="tags-input"
						type="question-tags"
						label="Tags"
						value={question.tags?.join(', ')}
						required={false}
						update={(value: string) =>
							props.save({
								...question,
								tags: value
									.split(', ')
									.map((tag) => tag.trim())
									.filter(Boolean),
							})
						}
					/>
				</div>
				<div class="col-span-6 sm:col-span-2">
					<Label
						for="randomize-input"
						text="Randomize Options"
						required={true}
					/>
					<SelectInput
						id="randomize-input"
						options={[
							{ text: 'No', value: 'false' },
							{ text: 'Yes', value: 'true' },
						]}
						selected={question.randomizeOptionOrder ? 'true' : 'false'}
						update={(value: string) => {
							props.save({
								...question,
								randomizeOptionOrder: value !== 'false',
							})
						}}
					/>
				</div>
				<div class="col-span-6 sm:col-span-2">
					<Label for="first-input" text="First Question" required={true} />
					<SelectInput
						id="first-input"
						options={[
							{ text: 'No', value: 'false' },
							{ text: 'Yes', value: 'true' },
						]}
						selected={question.first ? 'true' : 'false'}
						update={(value: string) => {
							props.save({
								...question,
								first: value !== 'false',
							})
						}}
					/>
				</div>
				<div class="col-span-6 sm:col-span-2">
					<Label for="last-input" text="Last Question" required={true} />
					<SelectInput
						id="last-input"
						options={[
							{ text: 'No', value: 'false' },
							{ text: 'Yes', value: 'true' },
						]}
						selected={question.last ? 'true' : 'false'}
						update={(value: string) => {
							props.save({
								...question,
								last: value !== 'false',
							})
						}}
					/>
				</div>
				<div class="block contents">
					{question.options
						.sort((a, b) => a.position - b.position)
						.map((option, index) => (
							<Option
								option={option}
								save={(updatedOption: Option) => {
									// Save the option.
									const options = [...question.options]
									options[index] = updatedOption

									props.save({
										...question,
										options,
									})
								}}
								delete={() => {
									// Delete the option.
									const options = [...question.options]
									options.splice(index, 1)

									props.save({
										...question,
										options,
									})
								}}
								duplicate={() => {
									// Duplicate the option.
									const options = [...question.options]
									const duplicatedOption = { ...options[index] }
									duplicatedOption.position = options.length + 1
									options.push(duplicatedOption)

									props.save({
										...question,
										options,
									})
								}}
							/>
						))}
				</div>
				<div class="block col-span-5"></div>
				<Button
					id="add-option-button"
					text="Add Option"
					action={() => {
						const options = question.options.sort(
							(a, b) => a.position - b.position,
						)
						const currentPosition = options[options.length - 1]?.position ?? 0

						props.save({
							...question,
							options: [
								...options,
								{
									text: '',
									type: 'select',
									position: currentPosition + 1,
								},
							],
						})
					}}
					type="text"
					class="col-span-1 text-xs"
				/>
			</>
		)
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Edit Conversation
					</h5>
				</div>
				<LoadingIndicator
					isLoading={
						typeof conversation.id === 'undefined' && currentError === undefined
					}
				/>
				<div class={typeof conversation.id === 'undefined' ? 'hidden' : ''}>
					<div class="sm:rounded-lg">
						<div class="grid grid-cols-6 gap-x-6 gap-y-4">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="name"
									value={conversation?.name}
									required={true}
									update={(value: string) =>
										handleConversationEdit({
											type: 'update-field',
											field: 'name',
											payload: value,
										})
									}
								/>
							</div>
							<div class="col-span-6 sm:col-span-3">
								<Label for="once-input" text="Once" required={true} />
								<SelectInput
									id="once-input"
									options={[
										{ text: 'No', value: 'false' },
										{ text: 'Yes', value: 'true' },
									]}
									selected={conversation?.once ? 'true' : 'false'}
									update={(value: string) => {
										handleConversationEdit({
											type: 'update-field',
											field: 'once',
											payload: value !== 'false',
										})
									}}
								/>
							</div>
							<div class="col-span-6">
								<TextInput
									id="description-input"
									label="Description"
									type="description"
									value={conversation?.description}
									required={true}
									update={(value: string) =>
										handleConversationEdit({
											type: 'update-field',
											field: 'description',
											payload: value,
										})
									}
								/>
							</div>
							<div class="col-span-6">
								<TextInput
									id="tags-input"
									label="Tags"
									type="tags"
									value={conversation?.tags?.join(', ')}
									required={true}
									update={(value: string) =>
										handleConversationEdit({
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
							{questions?.map((question, index) => (
								<Question
									question={question}
									number={index + 1}
									save={(updatedQuestion: QuestionFormState) => {
										const copyOfQuestions = [...questions]
										copyOfQuestions[index] = updatedQuestion

										setQuestions(copyOfQuestions)
									}}
									delete={() => {
										const copyOfQuestions = [...questions]
										const [deletedQuestion] = copyOfQuestions.splice(index, 1)

										if ((deletedQuestion as Question).id)
											deleteQuestion(deletedQuestion as Question)
												.then(() => {})
												.catch((error) => setErrorMessage(error.message))

										setQuestions(copyOfQuestions)
									}}
								/>
							))}
							<hr class="col-span-6 dark:border-gray-700" />
						</div>
					</div>
					<div class="mt-4 grid grid-cols-6 gap-6">
						<Button
							id="back-button"
							text="Back"
							action={() => route('/conversations')}
							type="text"
							class="col-span-2 md:col-span-1 text-left"
						/>
						<div class="hidden md:block md:col-span-2"></div>
						<Button
							id="add-question-button"
							text="Add Question"
							action={() =>
								setQuestions([
									...questions,
									{
										text: '',
										first: false,
										last: false,
										randomizeOptionOrder: false,
										options: [],
										tags: [],
									},
								])
							}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="delete-button"
							text="Delete"
							action={async () => deleteConversation()}
							type="danger"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="save-button"
							text="Save"
							action={async () => saveConversation()}
							type="filled"
							class={isSaving ? 'hidden' : 'col-span-2 md:col-span-1'}
						/>
						<LoadingIndicator
							isLoading={isSaving}
							class="col-span-2 md:col-span-1"
						/>
					</div>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
				<Toast id="success-message" type="info" text={currentSuccess} />
			</div>
		</PageWrapper>
	)
}
