import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calendapro.fr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/marketplace',
          '/blog',
          '/contact',
          '/support',
          '/documentation',
          '/mentions-legales',
          '/cgu',
          '/confidentialite',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/api',
          '/api/*',
          '/auth',
          '/auth/*',
          '/sign-in',
          '/sign-up',
          '/client-sign-in',
          '/client-sign-up',
          '/client',
          '/client/*',
          '/auth-choice',
          '/pro-onboarding',
          '/client-onboarding',
          '/admin',
          '/admin/*',
          '/_next',
          '/_next/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/marketplace',
          '/blog',
          '/contact',
          '/support',
          '/documentation',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/api',
          '/api/*',
          '/auth',
          '/auth/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
