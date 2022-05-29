// source/pages/users/view.tsx
// Defines and exports the view user page.

import { useState, useEffect } from 'preact/hooks'

import {
	TextInput,
	Toast,
	LoadingIndicator,
	PageWrapper,
	IconButton,
} from '@/components'
import { fetch, isErrorResponse } from '@/utilities/http'
import { errors } from '@/utilities/text'

import type { User, Attribute, UserAttribute, AttributeSnapshot } from '@/api'

/**
 * Show the message due to which the value was set, and the time at which it
 * was set.
 *
 * @prop {AttributeSnapshot} snapshot - The attribute snapshot.
 *
 * @component
 */
const AttributeSnapshotMetadata = (props: { snapshot: AttributeSnapshot }) => {
	const time = new Date(props.snapshot.timestamp).toLocaleString('IN')
	const [message] = useState<string | undefined>(props.snapshot.message?.id)
	const [observer, setObserver] = useState<string | 'bot'>(
		props.snapshot.observer,
	)

	useEffect(() => {
		const fetchUser = async (userId: string): Promise<{ name: string }> => {
			if (userId === 'bot') return { name: 'Bot' }

			const response = await fetch<{ user: User }>({
				url: `/users/${userId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.user
		}

		fetchUser(observer)
			.then((user) => setObserver(user.name))
			.catch((_error) => {})
	}, [])

	return (
		<label class="block text-xs text-right font-medium text-gray-700 dark:text-gray-500">
			<span>
				{observer} {message} @ {time}
			</span>
		</label>
	)
}

/**
 * Show the value of the attribute at a certain point in time.
 *
 * @prop {UserAttribute} attribute - The attribute.
 * @prop {AttributeSnapshot} snapshot - The snapshot of the attribute to render.
 *
 * @component
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare,no-import-assign
const AttributeSnapshot = (props: {
	attribute: UserAttribute
	snapshot: AttributeSnapshot
}) => {
	return (
		<>
			<textarea
				value={props.snapshot.value.toString()}
				rows={1}
				disabled
				class="appearance-none rounded-lg relative block w-full my-2 px-3 py-2 border border-gray-300 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10 sm:text-sm font-mono"
				style={{
					resize:
						props.snapshot.value.toString().length > 40 ? 'vertical' : 'none',
				}}
			/>
			<AttributeSnapshotMetadata snapshot={props.snapshot} />
		</>
	)
}

/**
 * The view user page.
 *
 * @prop {string} userId - The ID of the user to view.
 *
 * @page
 */
export const ViewUserPage = (props: { userId: string }) => {
	// Define a state for the current user, and their attributes.
	const [user, setUser] = useState<User | undefined>(undefined)
	const [userAttributes, setUserAttributes] = useState<
		Array<Attribute & UserAttribute>
	>([])

	// Define a state for error messages and the list of users.
	const [currentError, setErrorMessage] = useState<string | undefined>(
		undefined,
	)

	// Fetch the user and their attributes using the API.
	useEffect(() => {
		const fetchUser = async (): Promise<User> => {
			const response = await fetch<{ user: User }>({
				url: `/users/${props.userId}`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.user
		}

		const fetchAttributes = async (): Promise<UserAttribute[]> => {
			const response = await fetch<{ attributes: UserAttribute[] }>({
				url: `/users/${props.userId}/attributes`,
				method: 'get',
			})

			// Handle any errors that might arise...
			if (isErrorResponse(response)) throw new Error(response.error.message)
			// ...and if there are none, return the data.
			return response.attributes
		}

		const replaceIds = async (
			userAttributes: UserAttribute[],
		): Promise<Array<Attribute & UserAttribute>> => {
			const attributes = []

			for (const userAttribute of userAttributes) {
				const response = await fetch<{ attribute: Attribute }>({
					url: `/attributes/${userAttribute.id}`,
					method: 'get',
				})

				// Ignore any errors that might arise...
				if (isErrorResponse(response)) continue
				// ...and if there are none, return the data.
				attributes.push({
					...userAttribute,
					...response.attribute,
				})
			}

			return attributes
		}

		fetchUser()
			.then(setUser)
			.catch((error) => setErrorMessage(error.message))

		fetchAttributes()
			.then(replaceIds)
			.then(setUserAttributes)
			.catch((error) => setErrorMessage(error.message))
	}, [])

	/**
	 * An attribute of a user.
	 *
	 * @prop {UserAttribute} attribute - The attribute.
	 *
	 * @component
	 */
	const Attribute = (attrProps: { attribute: Attribute & UserAttribute }) => {
		// Define states for the attribute, the current value and the visual
		// components.
		const [attribute, setAttribute] = useState<Attribute & UserAttribute>(
			attrProps.attribute,
		)
		const [currentValue, setCurrentValue] = useState<string | number | boolean>(
			attribute.value,
		)
		const [showHistory, toggleHistory] = useState<boolean>(false)
		const [focus, toggleFocus] = useState<boolean>(false)

		/**
		 * Update the attribute using the API.
		 */
		const saveAttribute = async (): Promise<void> => {
			// First check if the value has really been changed.
			if (attribute.value === currentValue) return

			// Make the API call to update the attribute.
			const response = await fetch<{ attribute: UserAttribute }>({
				url: `/users/${props.userId}/attributes/${attribute.id}`,
				method: 'put',
				json: { value: currentValue },
			})

			// Handle any errors that might arise.
			if (isErrorResponse(response)) {
				const { error } = response

				switch (error.code) {
					case 'entity-not-found':
						setErrorMessage(errors.get('attribute-does-not-exist'))
						break
					default:
						setErrorMessage(error.message)
				}

				return
			}

			// Else update the current attribute.
			setAttribute({
				...attribute,
				...response.attribute,
			})
		}

		return (
			<div class="col-span-6 sm:col-span-3 pb-3 border-b border-gray-600">
				<div>
					<label class="grid grid-cols-4 text-sm font-medium text-on-surface dark:text-on-surface-dark">
						<span class="pt-1 col-span-1 text-left">{attribute.name}</span>
						<div class="block col-span-2"></div>
						<div class="col-span-1 text-right">
							<IconButton
								id="save-attribute-button"
								action={async () => saveAttribute()}
								icon="save"
								class={`w-fit text-gray-700 dark:text-gray-400 ${
									focus ? '' : 'hidden'
								}`}
							/>
							<IconButton
								id="add-attribute-button"
								action={() =>
									showHistory ? toggleHistory(false) : toggleHistory(true)
								}
								icon={showHistory ? 'up' : 'down'}
								class="w-fit text-gray-700 dark:text-gray-400"
							/>
						</div>
					</label>
					<textarea
						value={attribute.value.toString()}
						rows={1}
						class="appearance-none rounded-lg relative block w-full my-2 px-3 py-2 border border-gray-300 dark:border-background-dark bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark focus:outline-none focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark focus:z-10 sm:text-sm font-mono"
						style={{
							resize: currentValue.toString().length > 40 ? 'vertical' : 'none',
						}}
						onChange={(event: any) => setCurrentValue(event.target.value)}
						onFocus={() => toggleFocus(true)}
						onBlur={() => toggleFocus(false)}
					/>
					<AttributeSnapshotMetadata
						snapshot={attribute.history[attribute.history.length - 1]}
					/>
					<div class={showHistory ? 'block' : 'hidden'}>
						{[...attribute.history].reverse().map((snap, index) => {
							if (index !== 0)
								return (
									<AttributeSnapshot attribute={attribute} snapshot={snap} />
								)
							return <></>
						})}
					</div>
				</div>
			</div>
		)
	}

	return (
		<PageWrapper>
			<div class="mx-auto p-8 max-w-4xl bg-white rounded-lg border dark:bg-background-dark dark:border-gray-700">
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
						User Details
					</h5>
				</div>
				<LoadingIndicator
					isLoading={typeof user === 'undefined' && currentError === undefined}
				/>
				<div class={typeof user === 'undefined' ? 'hidden' : ''}>
					<div class="sm:rounded-lg">
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="name-span"
									label="Name"
									type="name"
									value={user?.name}
									disabled={true}
								/>
							</div>
							<div class="col-span-6 sm:col-span-3">
								<TextInput
									id="email-span"
									label="Email"
									type="email"
									value={user?.email}
									disabled={true}
								/>
							</div>
							<hr class="col-span-6 dark:border-gray-700" />
							<h5 class="col-span-5 text-xl font-bold leading-none text-gray-900 dark:text-white">
								User Attributes
							</h5>
							{userAttributes?.map((attr) => (
								<Attribute attribute={attr} />
							))}
						</div>
					</div>
				</div>
				<Toast id="error-message" type="error" text={currentError} />
			</div>
		</PageWrapper>
	)
}
