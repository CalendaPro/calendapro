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
  '/api/stripe/webhook',
  '/api/clerk/webhook',
  '/api/marketplace(.*)',
  '/api/auth/client-callback(.*)',
  '/api/auth/check(.*)',
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