export const aboutSummary =
  'Retired software engineer, formerly at Facebook, Face.com, and Telmap.com. Today I keep Hydra and OmegaConf running and make room for new ideas.';

export const featuredProjects = [
  {
    title: 'Rakia',
    tag: 'Current project',
    logo: {src: '/img/projects/rakia/logo.svg'},
    embed: {
      src: 'https://beta.rakia.earth/?t=2461252.87839&ts=604800&f=moon&l=moon&bi=0&co=7740.648%2C2472.167%2C-495.928&s=1&embed=1',
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
    title: 'Backlog Atlas',
    tag: 'Open source - Python',
    logo: {src: '/img/projects/backlog-atlas/logo.svg'},
    screenshots: [
      {
        src: '/img/projects/backlog-atlas/dashboard.png',
        previewSize: '2386x1126',
        fullSrc: '/img/projects/backlog-atlas/dashboard.png',
        fullSize: '2386x1126',
        alt:
          'Backlog Atlas dashboard showing backlog summary tables, filters, issue rows, and recent activity',
        fit: 'contain',
      },
    ],
    screenshotLayout: 'panoramic',
    tagline:
      'Self-hosted backlog snapshots and static dashboards for GitHub maintainers.',
    description:
      'Backlog Atlas turns GitHub issue and pull request metadata into versioned repository snapshots and a static dashboard. It is designed for maintainers who need a public, low-maintenance way to prioritize work across one or more repositories without running a hosted service.',
    stats: [
      {
        label: 'PyPI package',
        value: 'backlog-atlas',
        badge: {
          src: 'https://img.shields.io/pypi/v/backlog-atlas?style=flat&logo=pypi&label=pypi',
          href: 'https://pypi.org/project/backlog-atlas/',
        },
      },
      {
        type: 'github-stars',
        label: 'GitHub stars',
        value: 'omry/backlog-atlas',
        badge: {
          src: 'https://img.shields.io/github/stars/omry/backlog-atlas?style=flat&logo=github&label=stars',
          href: 'https://github.com/omry/backlog-atlas/stargazers',
        },
      },
    ],
    links: [
      {
        type: 'website',
        label: 'Dashboard',
        href: 'https://omry.github.io/backlog-atlas/',
      },
      {
        type: 'website',
        label: 'Blog',
        href: '/blog/introducing-backlog-atlas/',
      },
      {type: 'github', label: 'GitHub', href: 'https://github.com/omry/backlog-atlas'},
      {type: 'package', label: 'PyPI', href: 'https://pypi.org/project/backlog-atlas/'},
      {
        type: 'docs',
        label: 'Guide',
        href: 'https://github.com/omry/backlog-atlas/blob/main/USER-GUIDE.md',
      },
    ],
  },
  {
    title: 'Agent Skill Installer',
    tag: 'Open source - Python',
    logo: {initials: 'ASI'},
    screenshots: [
      {
        src: '/img/projects/agent-skill-installer/ui-install.png',
        previewSize: '1359x987',
        fullSrc: '/img/projects/agent-skill-installer/ui-install.png',
        fullSize: '1359x987',
        alt: 'Agent Skill Installer interactive source picker',
        fit: 'contain',
      },
    ],
    screenshotLayout: 'wide',
    tagline:
      'Pleasant installs for Codex and Claude Code skills from GitHub, PyPI, local checkouts, and wheel files.',
    description:
      'Agent Skill Installer is a small Python tool for installing Codex and Claude Code skills from GitHub, PyPI, local checkouts, or local wheel files. It supports global and repository-specific installs, writes discoverability blocks, records enough install state to safely upgrade or uninstall what it owns, and validates agent-specific installer metadata.',
    stats: [
      {
        label: 'PyPI package',
        value: 'agent-skill-installer',
        badge: {
          src: 'https://img.shields.io/pypi/v/agent-skill-installer?style=flat&logo=pypi&label=pypi',
          href: 'https://pypi.org/project/agent-skill-installer/',
        },
      },
      {
        type: 'github-stars',
        label: 'GitHub stars',
        value: 'omry/agent-skill-installer',
        badge: {
          src: 'https://img.shields.io/github/stars/omry/agent-skill-installer?style=flat&logo=github&label=stars',
          href: 'https://github.com/omry/agent-skill-installer/stargazers',
        },
      },
    ],
    links: [
      {
        type: 'website',
        label: 'Blog',
        href: '/blog/introducing-agent-skill-installer/',
      },
      {type: 'github', label: 'GitHub', href: 'https://github.com/omry/agent-skill-installer'},
      {type: 'package', label: 'PyPI', href: 'https://pypi.org/project/agent-skill-installer/'},
      {type: 'docs', label: 'Docs', href: 'https://github.com/omry/agent-skill-installer#readme'},
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

export const smallProjects = [
  {
    title: 'Stale Buffer Guard',
    summary:
      'Stops open VS Code tabs from showing old text after version control, formatters, or agents change files on disk; warns when unsaved edits are based on an older version.',
    links: [
      {label: 'GitHub', href: 'https://github.com/omry/stale-buffer-guard'},
      {
        label: 'Marketplace',
        href: 'https://marketplace.visualstudio.com/items?itemName=omry.stale-buffer-guard',
      },
      {label: 'Blog', href: '/blog/introducing-stale-buffer-guard/'},
    ],
  },
  {
    title: 'llm-auth',
    summary:
      'Local auth surfaces for LLM developer tools: API keys, ChatGPT OAuth, status checks, tests, and safer `.env` handling.',
    links: [
      {label: 'GitHub', href: 'https://github.com/omry/llm-auth'},
      {label: 'PyPI', href: 'https://pypi.org/project/llm-auth/'},
      {label: 'Blog', href: '/blog/introducing-llm-auth/'},
    ],
  },
];

export function projectAnchor(project) {
  return project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const blogTopics = [
  {
    title: 'Engineering',
    body: 'Configuration, libraries, maintenance, and systems work.',
  },
  {
    title: 'Projects',
    body: 'Progress updates and context for public work as it becomes ready.',
  },
  {
    title: 'Architecture',
    body: 'Ponderosa and other design/building posts when they need a stable home.',
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
