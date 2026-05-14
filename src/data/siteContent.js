export const aboutSummary =
  'Retired software engineer, formerly at Facebook, Face.com, and Telmap.com. Today I keep Hydra and OmegaConf running and make room for new ideas.';

export const featuredProjects = [
  {
    title: 'Rakia',
    tag: 'Current project',
    logo: {src: '/img/projects/rakia/logo.svg'},
    embed: {
      src: 'https://rakia.earth/?t=2461252.87839&ts=604800&f=moon&l=moon&bi=0&co=7740.648%2C2472.167%2C-495.928&s=1',
      title: 'Interactive Rakia Moon view',
    },
    tagline:
      'Realistic 3D solar system simulator for sunsets, eclipses, and planetary motion in the browser.',
    description:
      'Rakia is a browser-based 3D solar-system model focused on making planetary motion, eclipses, sunsets, and sky geometry inspectable rather than abstract. The name comes from the Hebrew רקיע, meaning "firmament" and pronounced rah-kee-AH. The current site emphasizes direct manipulation and visual context: orbit views, body labels, source links, and a full app surface for exploring celestial positions.',
    links: [{type: 'website', label: 'Website', href: 'https://rakia.earth/'}],
  },
  {
    title: 'OmegaConf',
    tag: 'Open source - Python',
    logo: {initials: 'OC'},
    screenshots: [
      {
        src: '/img/projects/omegaconf/interpolation-770x770.png',
        previewSize: '770x770',
        fullSrc: '/img/projects/omegaconf/raw/interpolation-example.png',
        fullSize: '770x770',
        alt: 'OmegaConf interpolation example',
      },
    ],
    tagline: 'Flexible Python configuration system. The last one you will ever need.',
    description:
      'OmegaConf is a Python configuration library for hierarchical, typed, and composable configuration. It supports structured configs, interpolation, merging, and command-line overrides, and is used directly as a library as well as underneath Hydra.',
    stats: [
      {
        type: 'github-stars',
        label: 'GitHub stars',
        value: '2,385',
        badge: {
          src: 'https://img.shields.io/github/stars/omry/omegaconf?style=flat&logo=github&label=stars',
          href: 'https://github.com/omry/omegaconf/stargazers',
        },
      },
      {
        label: 'PyPI downloads/mo',
        value: '36.6M',
        badge: {
          src: 'https://pepy.tech/badge/omegaconf/month',
          href: 'https://pepy.tech/project/omegaconf',
        },
      },
      {
        label: 'PyPI package',
        value: 'omegaconf',
        badge: {
          src: 'https://img.shields.io/pypi/v/omegaconf?style=flat&logo=pypi&label=pypi',
          href: 'https://pypi.org/project/omegaconf/',
        },
      },
    ],
    links: [
      {
        type: 'docs',
        label: 'Docs',
        href: 'https://omegaconf.readthedocs.io/en/latest/',
      },
      {type: 'github', label: 'GitHub', href: 'https://github.com/omry/omegaconf'},
    ],
  },
  {
    title: 'Hydra',
    tag: 'Open source - Python',
    logo: {src: '/img/projects/hydra/logo.svg'},
    screenshots: [
      {
        src: '/img/projects/hydra/product-teardown-1000x1000.svg',
        previewSize: '1000x1000 SVG',
        fullSrc: '/img/projects/hydra/raw/product-teardown-illustration.svg',
        fullSize: '930x819 SVG',
        alt: 'Hydra product teardown illustration',
      },
    ],
    tagline: 'A framework for elegantly configuring complex applications.',
    description:
      'Hydra is a Python framework for configuring complex applications from composable config files and command-line overrides. It is especially useful when the same application needs to run across many environments, experiments, launchers, or parameter sweeps without turning configuration into hand-written glue code.',
    stats: [
      {
        type: 'github-stars',
        label: 'GitHub stars',
        value: '10,362',
        badge: {
          src: 'https://img.shields.io/github/stars/facebookresearch/hydra?style=flat&logo=github&label=stars',
          href: 'https://github.com/facebookresearch/hydra/stargazers',
        },
      },
      {
        label: 'PyPI downloads/mo',
        value: '17.4M',
        badge: {
          src: 'https://pepy.tech/badge/hydra-core/month',
          href: 'https://www.pepy.tech/projects/hydra-core',
        },
      },
      {
        label: 'PyPI package',
        value: 'hydra-core',
        badge: {
          src: 'https://img.shields.io/pypi/v/hydra-core?style=flat&logo=pypi&label=pypi',
          href: 'https://pypi.org/project/hydra-core/',
        },
      },
    ],
    links: [
      {type: 'website', label: 'Website', href: 'https://hydra.cc/'},
      {type: 'github', label: 'GitHub', href: 'https://github.com/facebookresearch/hydra'},
    ],
  },
  {
    title: 'HoodleFinance',
    tag: 'Personal tools',
    logo: {src: '/img/projects/hoodlefinance/logo.svg'},
    screenshots: [
      {
        src: '/img/projects/hoodlefinance/formula-1000x500.png',
        previewSize: '1000x500',
        fullSrc: '/img/projects/hoodlefinance/raw/formula-lookup.png',
        fullSize: '924x587',
        alt: 'HoodleFinance formula example with price lookup',
      },
      {
        src: '/img/projects/hoodlefinance/coverage-1000x500.png',
        previewSize: '1000x500',
        fullSrc: '/img/projects/hoodlefinance/raw/coverage-examples.png',
        fullSize: '1029x600',
        alt: 'HoodleFinance spreadsheet examples for foreign ETFs and Philippine stocks',
      },
    ],
    tagline:
      'Market data for U.S. and international listings, identifier lookups, and built-in currency conversion for Google Sheets.',
    description:
      'HoodleFinance is a Google Sheets Addon for fetching market data in places where GOOGLEFINANCE falls short, especially around international tickers and identifiers. It also features built-in currency conversion.',
    stats: [
      {
        type: 'github-stars',
        label: 'GitHub stars',
        value: '2',
        badge: {
          src: 'https://img.shields.io/github/stars/omry/hoodlefinance?style=flat&logo=github&label=stars',
          href: 'https://github.com/omry/hoodlefinance/stargazers',
        },
      },
    ],
    links: [
      {type: 'website', label: 'Website', href: 'https://hoodlefinance.com/'},
      {type: 'github', label: 'GitHub', href: 'https://github.com/omry/hoodlefinance'},
    ],
  },
];

const homeFeaturedProjectTitles = new Set(['Rakia']);

export const homeFeaturedProjects = featuredProjects.filter((project) =>
  homeFeaturedProjectTitles.has(project.title),
);

export const homeProjectListProjects = featuredProjects.filter(
  (project) => !homeFeaturedProjectTitles.has(project.title),
);

export function projectAnchor(project) {
  return project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const secondaryProjects = [];

export const noteTopics = [
  {
    title: 'Engineering',
    body: 'Configuration, libraries, maintenance, and systems work.',
  },
  {
    title: 'Projects',
    body: 'Progress notes and context for public work as it becomes ready.',
  },
  {
    title: 'Architecture',
    body: 'Ponderosa and other design/building notes when they need a stable home.',
  },
  {
    title: 'Baking',
    body: 'Sourdough and other practical experiments outside software.',
  },
  {
    title: 'Personal',
    body: 'Occasional writing that does not fit a project or technical category.',
  },
];

export const profileLinks = [
  {label: 'GitHub', href: 'https://github.com/omry'},
  {
    label: 'Stack Overflow',
    href: 'https://stackoverflow.com/users/1930838/omry-yadan',
  },
  {label: 'PyPI', href: 'https://pypi.org/user/omry/'},
  {label: 'X / Twitter', href: 'https://twitter.com/omry'},
];
