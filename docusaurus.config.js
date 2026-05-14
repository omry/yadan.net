// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Omry Yadan',
  tagline: 'May your sockets never timeout.',
  favicon: 'img/favicon-v2.svg',
  url: 'https://yadan.net',
  baseUrl: '/',
  organizationName: 'omry',
  projectName: 'yadan.net',
  customFields: {
    formspreeFormId: 'xdabvpjd',
  },
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'ignore',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          routeBasePath: 'blog',
          blogTitle: 'Notes',
          blogDescription:
            'Project notes, maintenance context, and longer-form writing from Omry Yadan.',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      metadata: [
        {
          name: 'description',
          content:
            'Personal website for Omry Yadan: projects, notes, and selected personal context.',
        },
        {property: 'og:title', content: 'Omry Yadan · Yadan.net'},
        {
          property: 'og:description',
          content: 'Projects, notes, and selected context from Omry Yadan.',
        },
      ],
      navbar: {
        title: null,
        logo: {
          alt: 'OY logo',
          src: 'img/oy-logo-night-v2.svg',
          srcDark: 'img/oy-logo-night-v2.svg',
          width: 32,
          height: 32,
        },
        items: [
          {to: '/', label: 'Home', position: 'left', activeBaseRegex: '^/$'},
          {to: '/projects', label: 'Projects', position: 'left'},
          {to: '/blog', label: 'Notes', position: 'left'},
          {to: '/about', label: 'About', position: 'left'},
          {to: '/contact', label: 'Contact', position: 'left'},
        ],
      },
    }),
};

module.exports = config;
