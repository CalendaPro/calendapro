import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/auth-error(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/client-sign-in(.*)',
  '/client-sign-up(.*)',
  '/marketplace(.*)',
  '/onboarding(.*)',
  '/client/sign-in(.*)',
  '/client/sign-up(.*)',
  '/client/auth-callback(.*)',
  '/api/stripe/webhook',
  '/api/stripe/booking-checkout',
  '/api/stripe/verify-booking',
  '/api/booking',
  '/api/clerk/webhook',
  '/api/marketplace(.*)',
  '/api/auth/client-callback(.*)',
  '/api/auth/check(.*)',
  '/api/auth/sync(.*)',  // Sync route for post-signup flow
  '/api/availabilities(.*)',
  '/api/calendar/google/callback(.*)',
  '/api/calendar/google/webhook',
  '/api/public(.*)',
  '/api/cron(.*)',
  '/api/reminders/check',
  '/booking(.*)',
  '/auth-choice(.*)',
  '/cgu(.*)',
  '/confidentialite(.*)',
  '/mentions-legales(.*)',
  '/contact(.*)',
  '/blog(.*)',
  '/plans(.*)',
  '/explore(.*)',
  '/documentation(.*)',
  '/support(.*)',
  '/widget(.*)',
  '/:username',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}