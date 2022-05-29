// source/app.tsx
// Defines and exports the application routes.

import { Component } from 'preact'
import { Router, route } from 'preact-router'

import { Navbar } from './components'
import {
	HomePage,
	SignInPage,
	SignUpPage,
	UserListPage,
	ViewUserPage,
	GroupListPage,
	GroupEditPage,
	GroupCreatePage,
	ConversationListPage,
	ConversationCreatePage,
	ConversationEditPage,
	NotFoundPage,
} from './pages'

import { fetch, isErrorResponse } from './utilities/http'
import { isAuthenticated } from './utilities/auth'

import type { User } from './api'

/**
 * The application's root component. Here all the routes are defined, and
 * authentication is managed.
 *
 * @component
 */
export class App extends Component {
	// Remember the current URL according to the router so we can update the
	// navbar when the page changes.
	state = { currentUrl: '/', groot: false }

	/**
	 * Check whether the user is signed in or not.
	 *
	 * @returns {boolean} - Whether or not the user is signed in.
	 */
	isUserSignedIn = () => {
		const isAuthRoute =
			window.location.pathname === '/signin' ||
			window.location.pathname === '/signup'
		return isAuthenticated() && !isAuthRoute
	}

	/**
	 * Fetch information about the current user, if any.
	 */
	componentWillMount = async () => {
		// First make sure they are signed in. If not, redirect them to the sign in page.
		if (!this.isUserSignedIn()) return route('/signin')

		// Fetch user metadata, which includes whether or not the user is Groot.
		// This allows pages to render some content only if the user is Groot.
		const response = await fetch<{
			user: User & {
				isGroot: boolean
				token: string
			}
		}>({
			url: '/meta',
			method: 'get',
		})
		// Nevermind if an error occurs, assume the user is not groot.
		if (isErrorResponse(response)) return

		// Set whether or not the user is Groot.
		this.setState({ groot: response.user.isGroot })
	}

	/**
	 * Since we do not do static site generation, the actual page (e.g., `/signin.html`)
	 * will not exist. So whenever someone types in the URL instead of clicking a
	 * button that is wired to use preact-router's navigation method, we need to
	 * redirect the user to the right page through the `route` function.
	 */
	componentDidMount = () => {
		const queryParameters = new URLSearchParams(window.location.search)
		const redirectTo = queryParameters.get('redirect')

		if (redirectTo) route(redirectTo, true)
	}

	/**
	 * The function that handles a change in routes.
	 */
	handleRoute = (event: { url: string }) => {
		// Update the current URL for the navbar.
		this.setState({ currentUrl: event.url })
		// All we need to do is check if the user is authenticated. If yes, then
		// let them go ahead; else redirect them to the sign in page.
		if (
			!this.isUserSignedIn() &&
			event.url !== '/signin' &&
			event.url !== '/signup'
		)
			route('/signin')
	}

	/**
	 * The function that renders the routes.
	 */
	render = () => {
		// Define a list of routes that need to be rendered.
		const routes = [
			{
				path: '/',
				name: 'Home',
				component: HomePage,
				nav: true,
			},
			{
				path: '/signin',
				name: 'Sign In',
				component: SignInPage,
				nav: false,
			},
			{
				path: '/signup',
				name: 'Sign Up',
				component: SignUpPage,
				nav: false,
			},
			{
				path: '/users',
				name: 'Users',
				component: UserListPage,
				nav: this.state.groot,
			},
			{
				path: '/users/:userId',
				name: 'View User',
				component: ViewUserPage,
				nav: false,
			},
			{
				path: '/groups',
				name: 'Groups',
				component: GroupListPage,
				nav: true,
			},
			{
				path: '/groups/create',
				name: 'Create Group',
				component: GroupCreatePage,
				nav: false,
			},
			{
				path: '/groups/:groupId/edit',
				name: 'Edit Group',
				component: GroupEditPage,
				nav: false,
			},
			{
				path: '/conversations',
				name: 'Conversations',
				component: ConversationListPage,
				nav: this.state.groot,
			},
			{
				path: '/conversations/create',
				name: 'Create Conversation',
				component: ConversationCreatePage,
				nav: false,
			},
			{
				path: '/conversations/:conversationId/edit',
				name: 'Edit Conversation',
				component: ConversationEditPage,
				nav: false,
			},
			{
				path: '/404',
				name: 'Not Found',
				component: NotFoundPage,
				nav: false,
			},
		]

		return (
			<div class="min-h-full bg-surface dark:bg-surface-dark">
				<Navbar routes={routes} currentUrl={this.state.currentUrl} />
				<Router onChange={this.handleRoute}>
					{routes.map((route) => {
						const Component = route.component

						// @ts-expect-error The props are injected by the router along with
						// the below two props.
						return <Component path={route.path} groot={this.state.groot} />
					})}
				</Router>
			</div>
		)
	}
}
