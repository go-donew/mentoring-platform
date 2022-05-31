// source/pages/groups/edit.tsx
// Defines and exports the group edit page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Button,
	TextInput,
	SelectInput,
	Toast,
	LoadingIndicator,
	PageWrapper,
	IconButton,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'

import type { User, Group, Conversation, Report } from '@/api'

/**
 * The form's state.
 */
type GroupFormState = Partial<Group>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type GroupEditFormAction =
	| {
			type: 'update-field'
			field: keyof Group
			payload?: any
	  }
	| {
			type: 'set-group'
			payload: Group
	  }
	| {
			type: 'add-participant'
	  }
	| {
			type: 'update-participant'
			payload: Group['participants']
	  }
	| {
			type: 'replace-participant'
			payload: {
				existing: string
				new: string
				role: 'mentee' | 'mentor' | 'supermentor'
			}
	  }
	| {
			type: 'add-conversation'
	  }
	| {
			type: 'update-conversation'
			payload: Group['conversations']
	  }
	| {
			type: 'replace-conversation'
			payload: {
				existing: string
				new: string
				roles: Array<'mentee' | 'mentor' | 'supermentor'>
			}
	  }
	| {
			type: 'add-report'
	  }
	| {
			type: 'update-report'
			payload: Group['reports']
	  }
	| {
			type: 'replace-report'
			payload: {
				existing: string
				new: string
				roles: Array<'mentee' | 'mentor' | 'supermentor'>
			}
	  }

/**
 * The group edit page.
 *
 * @prop {string} groupId - The ID of the group to edit.
 *
 * @page
 */
export const GroupEditPage = (props: { groupId: string }) => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {GroupFormState} state - The current state of the form.
	 * @param {GroupEditFormAction} action - The action to perform.
	 */
	const reducer = (
		state: GroupFormState,
		action: GroupEditFormAction,
	): GroupFormState => {
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
			case 'set-group':
				return action.payload
			case 'add-participant':
				return {
					...state,
					// @ts-expect-error We insert blank values instead of valid ones here.
					// Also, ESLint has a problem with blank object keys.
					// eslint-disable-next-line @typescript-eslint/naming-convention
					participants: { ...state.participants, '': '' },
				}
			case 'update-participant': {
				const updatedParticipants = { ...state.participants, ...action.payload }
				delete updatedParticipants['']

				return {
					...state,
					participants: updatedParticipants,
				}
			}

			case 'replace-participant': {
				const replacedParticipants = state.participants ?? {}
				delete replacedParticipants[action.payload.existing] // eslint-disable-line @typescript-eslint/no-dynamic-delete
				replacedParticipants[action.payload.new] = action.payload.role

				return {
					...state,
					participants: replacedParticipants,
				}
			}

			case 'add-conversation':
				return {
					...state,
					// ESLint has a problem with blank object keys.
					// eslint-disable-next-line @typescript-eslint/naming-convention
					conversations: { ...state.conversations, '': [] },
				}
			case 'update-conversation': {
				const updatedConversations = {
					...state.conversations,
					...action.payload,
				}
				delete updatedConversations['']

				return {
					...state,
					conversations: updatedConversations,
				}
			}

			case 'replace-conversation': {
				const replacedConversations = state.conversations ?? {}
				delete replacedConversations[action.payload.existing] // eslint-disable-line @typescript-eslint/no-dynamic-delete
				replacedConversations[action.payload.new] = action.payload.roles

				return {
					...state,
					conversations: replacedConversations,
				}
			}

			case 'add-report':
				return {
					...state,
					// ESLint has a problem with blank object keys.
					// eslint-disable-next-line @typescript-eslint/naming-convention
					reports: { ...state.reports, '': [] },
				}
			case 'update-report': {
				const updatedConversations = {
					...state.reports,
					...action.payload,
				}
				delete updatedConversations['']

				return {
					...state,
					reports: updatedConversations,
				}
			}

			case 'replace-report': {
				const replacedConversations = state.reports ?? {}
				delete replacedConversations[action.payload.existing] // eslint-disable-line @typescript-eslint/no-dynamic-delete
				replacedConversations[action.payload.new] = action.payload.roles

				return {
					...state,
					reports: replacedConversations,
				}
			}

			default:
				return state
		}

		return state
	}

	// Create the reducer.
	const [group, dispatch] = useReducer<GroupFormState, GroupEditFormAction>(
		reducer,
		{},
	)

	// Define a state for error messages and the list of users.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	// This list of users, conversations and reports is used to fill the dropdown,
	// so Groot can choose.
	const [users, setUsers] = useState<User[]>([])
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [reports, setReports] = useState<Report[]>([])

	// Fetch the group and the users using the API.
	useEffect(() => {
		const fetchGroup = async (): Promise<Group> => {
			const response = await fetch<{ group: Group }>({
				url: `/groups/${props.groupId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.group
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

		const fetchConversations = async (): Promise<Conversation[]> => {
			const response = await fetch<{ conversations: Conversation[] }>({
				url: '/conversations',
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.conversations
		}

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

		fetchGroup()
			.then((group) =>
				dispatch({
					type: 'set-group',
					payload: group,
				}),
			)
			.catch((error) => setErrorMessage(error.message))

		fetchUsers()
			.then(setUsers)
			.catch((error) => setErrorMessage(error.message))
		fetchConversations()
			.then(setConversations)
			.catch((error) => setErrorMessage(error.message))
		fetchReports()
			.then(setReports)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Update the group using the API.
	 */
	const saveGroup = async (): Promise<void> => {
		// Reset the error
		setErrorMessage(undefined)
		// Delete any blank participant IDs from the group.
		if (group.participants) delete group.participants['']
		else group.participants = {}
		// And set any blank roles to 'mentee'.
		for (const userId of Object.keys(group.participants)) {
			// @ts-expect-error It might be blank sometimes, so handle this case.
			if (group.participants[userId] === '')
				group.participants[userId] = 'mentee'
		}

		// Do the same for conversations and reports.
		if (group.conversations) delete group.conversations['']
		else group.conversations = {}
		for (const conversationId of Object.keys(group.conversations)) {
			// @ts-expect-error It might be blank sometimes, so handle this case.
			if (group.conversations[conversationId] === '')
				group.conversations[conversationId] = ['supermentor']
		}

		if (group.reports) delete group.reports['']
		else group.reports = {}
		for (const reportId of Object.keys(group.reports)) {
			// @ts-expect-error It might be blank sometimes, so handle this case.
			if (group.reports[reportId] === '')
				group.reports[reportId] = ['supermentor']
		}

		// Make the API call to update the group.
		const response = await fetch<{ group: Group }>({
			url: `/groups/${group.id}`,
			method: 'put',
			json: group,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response)) {
			const { error } = response

			switch (error.code) {
				case 'entity-not-found':
					setErrorMessage(errors.get('group-does-not-exist'))
					break
				default:
					setErrorMessage(error.message)
			}

			return
		}

		// Then route the user to the group list page.
		route('/groups')
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-7xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Edit Group
					</h5>
				</div>
				<LoadingIndicator
					isLoading={typeof group === 'undefined' && currentError === undefined}
				/>
				<div class={typeof group === 'undefined' ? 'hidden' : ''}>
					<div class="overflow-x-auto sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="group-name"
									value={group?.name}
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
									id="code-input"
									label="Code"
									type="group-code"
									value={group?.code}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'code',
											payload: value,
										})
									}
								/>
							</div>
							<div class="col-span-6">
								<TextInput
									id="tags-input"
									label="Tags"
									type="group-tags"
									value={group?.tags?.join(', ')}
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
							<table class="col-span-6">
								<thead>
									<tr class="text-sm text-gray-700 dark:text-gray-300">
										<th class="text-left font-medium">Participant</th>
										<th class="text-left font-medium">Role</th>
										<th class="text-right">
											<IconButton
												id="add-participant-button"
												action={() =>
													dispatch({
														type: 'add-participant',
													})
												}
												icon="add"
											/>
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(group?.participants ?? {}).map(
										([id, role]) => {
											return (
												<tr>
													<td class="pr-3">
														<SelectInput
															id="participant-id"
															options={users.map((user) => {
																return {
																	text: `${user.name} (${user.email})`,
																	value: user.id,
																}
															})}
															selected={id}
															update={(selectedValue: string) => {
																dispatch({
																	type: 'replace-participant',
																	payload: {
																		existing: id,
																		new: selectedValue,
																		role,
																	},
																})

																id = selectedValue
															}}
														/>
													</td>
													<td class="pr-3">
														<SelectInput
															id="participant-role"
															options={[
																{ text: 'Mentee', value: 'mentee' },
																{ text: 'Mentor', value: 'mentor' },
																{ text: 'Supermentor', value: 'supermentor' },
															]}
															selected={role}
															update={(selectedValue: string) => {
																dispatch({
																	type: 'update-participant',
																	payload: {
																		[id]: selectedValue as
																			| 'mentee'
																			| 'mentor'
																			| 'supermentor',
																	},
																})
															}}
														/>
													</td>
													<td class="pr-1 text-right">
														<IconButton
															id="remove-participant-button"
															action={() => {
																// Delete the participant, and update the form.
																const updatedParticipants =
																	group.participants ?? {}
																delete updatedParticipants[id] // eslint-disable-line @typescript-eslint/no-dynamic-delete

																dispatch({
																	type: 'update-field',
																	field: 'participants',
																	payload: updatedParticipants,
																})
															}}
															icon="remove"
														/>
													</td>
												</tr>
											)
										},
									)}
								</tbody>
							</table>
							<table class="col-span-6">
								<thead>
									<tr class="text-sm text-gray-700 dark:text-gray-300">
										<th class="text-left font-medium">Conversation</th>
										<th class="text-left font-medium">Roles</th>
										<th class="text-right">
											<IconButton
												id="add-conversation-button"
												action={() =>
													dispatch({
														type: 'add-conversation',
													})
												}
												icon="add"
											/>
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(group?.conversations ?? {}).map(
										([id, roles]) => {
											return (
												<tr>
													<td class="pr-3">
														<SelectInput
															id="conversation-id"
															options={conversations.map((conversation) => {
																return {
																	text: `${conversation.name}`,
																	value: conversation.id,
																}
															})}
															selected={id}
															update={(selectedValue: string) => {
																dispatch({
																	type: 'replace-conversation',
																	payload: {
																		existing: id,
																		new: selectedValue,
																		roles,
																	},
																})

																id = selectedValue
															}}
														/>
													</td>
													<td class="pr-3">
														<SelectInput
															id="conversation-roles"
															options={[
																{
																	text: 'Mentee, Mentor, Supermentor',
																	value: 'mentee,mentor,supermentor',
																},
																{
																	text: 'Mentor, Supermentor',
																	value: 'mentor,supermentor',
																},
																{ text: 'Supermentor', value: 'supermentor' },
															]}
															selected={roles.join(',')}
															update={(selectedValue: string) => {
																dispatch({
																	type: 'update-conversation',
																	payload: {
																		[id]: selectedValue.split(',') as Array<
																			'mentee' | 'mentor' | 'supermentor'
																		>,
																	},
																})
															}}
														/>
													</td>
													<td class="pr-1 text-right">
														<IconButton
															id="remove-conversation-button"
															action={() => {
																// Delete the conversation, and update the form.
																const updatedConversations =
																	group.conversations ?? {}
																delete updatedConversations[id] // eslint-disable-line @typescript-eslint/no-dynamic-delete

																dispatch({
																	type: 'update-field',
																	field: 'conversations',
																	payload: updatedConversations,
																})
															}}
															icon="remove"
														/>
													</td>
												</tr>
											)
										},
									)}
								</tbody>
							</table>
							<table class="col-span-6">
								<thead>
									<tr class="text-sm text-gray-700 dark:text-gray-300">
										<th class="text-left font-medium">Report</th>
										<th class="text-left font-medium">Roles</th>
										<th class="text-right">
											<IconButton
												id="add-report-button"
												action={() =>
													dispatch({
														type: 'add-report',
													})
												}
												icon="add"
											/>
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(group?.reports ?? {}).map(([id, roles]) => {
										return (
											<tr>
												<td class="pr-3">
													<SelectInput
														id="report-id"
														options={reports.map((report) => {
															return {
																text: `${report.name}`,
																value: report.id,
															}
														})}
														selected={id}
														update={(selectedValue: string) => {
															dispatch({
																type: 'replace-report',
																payload: {
																	existing: id,
																	new: selectedValue,
																	roles,
																},
															})

															id = selectedValue
														}}
													/>
												</td>
												<td class="pr-3">
													<SelectInput
														id="report-roles"
														options={[
															{
																text: 'Mentee, Mentor, Supermentor',
																value: 'mentee,mentor,supermentor',
															},
															{
																text: 'Mentor, Supermentor',
																value: 'mentor,supermentor',
															},
															{ text: 'Supermentor', value: 'supermentor' },
														]}
														selected={roles.join(',')}
														update={(selectedValue: string) => {
															dispatch({
																type: 'update-report',
																payload: {
																	[id]: selectedValue.split(',') as Array<
																		'mentee' | 'mentor' | 'supermentor'
																	>,
																},
															})
														}}
													/>
												</td>
												<td class="pr-1 text-right">
													<IconButton
														id="remove-report-button"
														action={() => {
															// Delete the report, and update the form.
															const updatedReports = group.reports ?? {}
															delete updatedReports[id] // eslint-disable-line @typescript-eslint/no-dynamic-delete

															dispatch({
																type: 'update-field',
																field: 'reports',
																payload: updatedReports,
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
							action={() => route('/groups')}
							type="text"
							class="col-span-2 md:col-span-1"
						/>
						<Button
							id="save-button"
							text="Save"
							action={async () => saveGroup()}
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
