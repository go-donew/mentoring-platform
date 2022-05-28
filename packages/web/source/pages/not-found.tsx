// source/pages/not-found.tsx
// Defines and exports the not found page.

import { route } from 'preact-router'

import { Button, PageWrapper } from '@/components'

/**
 * The not found page.
 *
 * @page
 */
export const NotFoundPage = () => (
	<PageWrapper>
		<div class="flex items-center justify-center py-12 bg-surface dark:bg-surface-dark">
			<div class="max-w-md w-full space-y-8">
				<div class="shadow overflow-hidden rounded-lg bg-background dark:bg-background-dark">
					<div class="pb-2 pt-4 px-4 grid grid-cols-5 grid-gap-0 divide-x divide-gray-300 dark:divide-gray-700 text-black">
						<span class="col-span-1 text-4xl text-left text-secondary dark:text-secondary-dark">
							404
						</span>
						<div class="col-span-4">
							<span class="pl-4 text-6xl text-left text-on-surface dark:text-on-primary-dark">
								Not Found
							</span>
							<br />
							<span class="pl-4 text-xs text-left text-on-surface dark:text-on-surface-dark font-medium">
								Please check the URL in the address bar and try again.
							</span>
						</div>
					</div>
					<div class="pt-2 pb-4 px-4 grid grid-cols-5 grid-gap-0">
						<div class="col-span-1"> </div>
						<div class="col-span-4 px-4">
							<Button
								id="go-home-button"
								text="Go back home"
								action={() => route('/')}
								type="filled"
								class="w-full"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</PageWrapper>
)
