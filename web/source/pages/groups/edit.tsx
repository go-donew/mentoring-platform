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

import type { User, Group } from '@/api'

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
	const [group, dispatch] = useReducer<GroupFormState, GroupEditFormAction>(
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
			<div class="mx-auto p-8 max-w-4xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
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
