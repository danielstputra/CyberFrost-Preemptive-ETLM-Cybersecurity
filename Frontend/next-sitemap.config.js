/**
 * next-sitemap Configuration
 * ===========================
 * Generates sitemap.xml + robots.txt after each build.
 * Run: npx next-sitemap
 * Or set as postbuild: "next build && next-sitemap"
 */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://cyberfrost.io',
  generateRobotsTxt: true,
  exclude: [
    '/dashboard/*',
    '/login',
    '/register',
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/dashboard' },
    ],
  },
};
