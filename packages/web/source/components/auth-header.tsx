// source/components/auth-header.tsx
// Defines and exports the header to display on auth pages.

/**
 * The header of an auth page.
 *
 * @prop {'signin' | 'signup'} mode - Whether the page is a signin page or signup page.
 *
 * @component
 */
export const AuthHeader = (props: { mode: 'signin' | 'signup' }) => (
	<div>
		<img class="mx-auto h-20 w-auto" src="/assets/icon.png" alt="DoNew Logo" />
		<h2 class="mt-6 text-center text-3xl text-on-surface dark:text-on-surface-dark font-bold">
			{props.mode === 'signin' ? 'Sign in to DoNew' : 'Create a DoNew account'}
		</h2>
		<p class="mt-2 text-center text-sm text-on-surface dark:text-on-surface-dark">
			Or
			<a
				class="cursor-pointer font-medium text-primary dark:text-secondary-dark"
				href={props.mode === 'signin' ? '/signup' : '/signin'}
				data-ref={`${props.mode}-instead-button}`}
			>
				{' '}
				{props.mode === 'signin' ? 'sign up' : 'sign in'} instead
			</a>
		</p>
	</div>
)
