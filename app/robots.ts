import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/profil', '/admin', '/api/'],
    },
    sitemap: 'https://coach-pc.vercel.app/sitemap.xml',
  }
}