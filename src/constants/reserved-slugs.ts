/**
 * Reserved Slugs Constants
 *
 * Contains the list of reserved slugs that cannot be used for job posting URLs.
 * This list is used for validation and conflict resolution in slug generation.
 *
 * @module src/constants/reserved-slugs
 */

export const RESERVED_SLUGS: string[] = [
  // Auth & session
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'signout',
  'auth',
  'authentication',
  'session',

  // Admin & management
  'admin',
  'administrator',
  'root',
  'moderator',
  'staff',
  'sysadmin',

  // User & profile
  'user',
  'users',
  'me',
  'profile',
  'account',
  'settings',

  // Dashboard & internal pages
  'dashboard',
  'home',
  'welcome',
  'overview',
  'portal',

  // API & system
  'api',
  'v1',
  'v2',
  'v3',
  'graphql',
  'rest',
  'rpc',
  'server',
  'backend',
  'webhook',
  'hooks',

  // Legal pages
  'terms',
  'privacy',
  'policy',
  'tos',
  'legal',
  'disclaimer',

  // Help & support
  'help',
  'support',
  'faq',
  'docs',
  'documentation',
  'manual',
  'guide',
  'howto',

  // Info pages
  'about',
  'contact',
  'feedback',
  'status',
  'info',

  // Content-related
  'blog',
  'post',
  'posts',
  'article',
  'articles',
  'news',
  'press',
  'events',

  // Media & files
  'image',
  'images',
  'video',
  'videos',
  'media',
  'upload',
  'uploads',
  'download',
  'downloads',

  // Common actions
  'search',
  'explore',
  'discover',
  'browse',
  'edit',
  'update',
  'delete',
  'create',
  'new',

  // Business logic
  'pricing',
  'plans',
  'billing',
  'payment',
  'checkout',
  'subscribe',
  'subscription',
  'invoice',
  'order',
  'cart',

  // Team & organization
  'team',
  'teams',
  'org',
  'organization',
  'company',
  'companies',

  // Roles & access
  'role',
  'roles',
  'permission',
  'permissions',
  'access',

  // Jobs & careers
  'job',
  'jobs',
  'career',
  'careers',
  'hiring',
  'apply',
  'vacancy',

  // Notification & message
  'notification',
  'notifications',
  'message',
  'messages',
  'chat',
  'inbox',
  'mail',

  // Reserved technical
  'null',
  'undefined',
  'true',
  'false',
  'error',
  '404',
  '500',
  'debug',
  'config',
  'env',

  // SEO & robots
  'sitemap',
  'robots',
  'favicon',
  'manifest',

  // Reserved system
  'assets',
  'static',
  'public',
  'private',
  'cdn',
  'lib',
  'node_modules',
  'vendor',

  // Miscellaneous
  'test',
  'tests',
  'testing',
  'demo',
  'example',
  'default',
  'sample',

  // Security-related
  'token',
  'jwt',
  'auth-token',
  'csrf',
  'captcha',
  'secure',
  'security',
  'hash',

  // Redirects or routing
  'redirect',
  'route',
  'routes',
  'url',
  'uri',

  // Analytics & tracking
  'analytics',
  'track',
  'tracking',
  'stats',
  'statistic',
  'monitoring',
  'log',
  'logs',

  // Localization
  'en',
  'id',
  'fr',
  'de',
  'jp',
  'zh',
  'locale',
  'language',
  'lang',
];
