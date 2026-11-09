import type { Turn } from '../lib/terminal-demo';

export interface NavLink {
  label: string;
  href: string;
  /**
   * Single-letter shortcut, printed beside the label as `[K]` and stamped on
   * the link as `data-hotkey` for the keyboard layer to resolve.
   */
  key: string;
}

export interface SiteSocial {
  label: string;
  href: string;
}

/** Single source for head tags, header, footer, RSS and the home profile links. */
export const SITE = {
  title: 'ngocsangyem',
  description: 'Personal dev notes by Sang Nguyen.',
  url: 'https://ngocsangyem.dev',
  author: 'Sang Nguyen',
  lang: 'en',
  nav: [
    { label: 'Posts', href: '/posts', key: 'P' },
    { label: 'Projects', href: '/projects', key: 'O' },
    { label: 'Portfolio', href: '/portfolio', key: 'F' },
    { label: 'About', href: '/about', key: 'A' },
  ] satisfies NavLink[],
  /** Shortcuts for the chrome controls that are not nav links. */
  hotkeys: { home: 'H', search: 'S' },
  socials: [
    { label: 'GitHub', href: 'https://github.com/ngocsangyem' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ngocsangyem/' },
  ] satisfies SiteSocial[],
  /** Rendered in the site footer. */
  email: 'nnsang24@gmail.com',
  /**
   * Home introduction, played as a short terminal session. Kept brief: the
   * full story lives on /about. The home page adds the profile links to the
   * reply, and omits the block while null.
   */
  greeting: {
    prompt: 'introduce yourself, briefly',
    verb: 'Thinking',
    seconds: 2,
    output: [
      'Hey! I’m Sang, a software engineer who turns ideas into thoughtful digital experiences.',
      'This blog is my notebook: frontend, code quality, tools, and workflows.',
      'Things I’ve learned, built, broken, and figured out. More on /about.',
    ],
    stream: true,
  } as Turn | null,
  /** Author's bio for /about, one paragraph per entry. */
  bio: [
    "I’m a software engineer who enjoys turning ideas into thoughtful digital experiences. " +
    'mostly in JavaScript and TypeScript. I started programming in high school and ' +
    'have been at it since.',
    'Day to day I write code and review a lot of it. Reading someone else\'s work ' +
    'closely is the cheapest way I know to catch a problem while it is still ' +
    'cheap to fix, and it is usually where I learn the most. Performance and ' +
    'security problems are far easier to spot in review than to retrofit later.',
    'This blog is where the rest of it goes: front-end practice, how I review ' +
    'code, and what makes working with other developers go well. I write the ' +
    'things I wish someone had written down for me.',
  ] as string[],
  repository: 'https://github.com/ngocsangyem/ngocsangyem-astro',
} as const;

/**
 * The downloadable résumé in `public/resume/`. `filename` is what the browser
 * saves it as; `size` is printed beside the link, so update it with the file.
 */
export const RESUME = {
  href: '/resume/nguyen-ngoc-sang-software-engineer-cv.pdf',
  filename: 'Nguyen_Ngoc_Sang_Software_Engineer_CV.pdf',
  size: '115 KB',
} as const;
