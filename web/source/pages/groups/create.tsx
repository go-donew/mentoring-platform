// source/pages/groups/create.tsx
// Defines and exports the group create page.

import { useState, useEffect, useReducer } from 'preact/hooks'
import { route } from 'preact-router'

import {
	Button,
	TextInput,
	SelectInput,
	Toast,
	PageWrapper,
	IconButton,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'

import type { User, Group } from '@/api'

const object = Object

/**
 * The form's state.
 */
type GroupFormState = Partial<Omit<Group, 'id'>>
/**
 * The action that is dispatched to the reducer to update the form's state.
 */
type GroupCreateFormAction =
	| {
			type: 'update-field'
			field: keyof Group
			payload?: any
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

/**
 * The group create page.
 *
 * @page
 */
export const GroupCreatePage = () => {
	/**
	 * The reducer to update the form. The reducer will be called with
	 * the current values of the form, and the action that was dispatched.
	 *
	 * @param {GroupFormState} state - The current state of the form.
	 * @param {GroupCreateFormAction} action - The action to perform.
	 */
	const reducer = (
		state: GroupFormState,
		action: GroupCreateFormAction,
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
			case 'add-participant':
				return {
					...state,
					// @ts-expect-error We insert blanks here instead of valid values.
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

			default:
				return state
		}

		return state
	}

	// Create the reducer.
	const [group, dispatch] = useReducer<GroupFormState, GroupCreateFormAction>(
		reducer,
		{},
	)

	// Define a state for error messages and the list of users.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)
	// This list of users is used to fill the dropdown, so Groot can choose which
	// users to add to the group.
	const [users, setUsers] = useState<User[]>([])

	// Fetch the users using the API.
	useEffect(() => {
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

		fetchUsers()
			.then(setUsers)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * Create the group using the API.
	 */
	const createGroup = async () => {
		// Reset the error
		setErrorMessage(undefined)
		// Delete any blank participant IDs from the group.
		if (group.participants) delete group.participants['']
		else group.participants = {}
		// And set any blank roles to 'mentee'.

		for (const userId of object.keys(group.participants)) {
			// @ts-expect-error It might be blank sometimes, so handle this case.
			if (group.participants[userId] === '')
				group.participants[userId] = 'mentee'
		}

		// TODO: add conversations and reports
		group.conversations = {}
		group.reports = {}

		// Make the API call to create the group.
		const response = await fetch<{ group: Group }>({
			url: '/groups',
			method: 'post',
			json: group,
		})

		// Handle any errors that might arise.
		if (isErrorResponse(response)) {
			const { error } = response

			switch (error.code) {
				case 'entity-not-found':
					setErrorMessage(errors.get('group-does-not-exist'))
					break
				case 'network-error':
					setErrorMessage(errors.get('network-error'))
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
			<div class="mx-auto p-8 max-w-4xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						Create Group
					</h5>
				</div>
				<div>
					<div class="overflow-x-auto sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-input"
									label="Name"
									type="name"
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
									type="code"
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
									type="tags"
									value={group?.tags?.join(', ')}
									required={true}
									update={(value: string) =>
										dispatch({
											type: 'update-field',
											field: 'tags',
											payload: value
												.split(', ')
												.map((tag) => tag.trim())
												.filter((tag) => Boolean(tag)),
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
									{object
										.entries(group?.participants ?? {})
										.map(([id, role]) => {
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
							text="Create"
							action={async () => createGroup()}
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
