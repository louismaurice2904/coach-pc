import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/profil', '/admin', '/api/'],
    },
    sitemap: 'https://novalys-app.fr/sitemap.xml',
  }
}