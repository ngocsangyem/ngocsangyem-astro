export interface NavLink {
  label: string;
  href: string;
}

export interface SiteSocial {
  label: string;
  href: string;
}

/** Single source for head tags, header, RSS and the social row. */
export const SITE = {
  title: 'ngocsangyem',
  description: 'Personal dev notes by Sang Nguyen.',
  url: 'https://ngocsangyem.dev',
  author: 'Sang Nguyen',
  lang: 'en',
  nav: [
    { label: 'Posts', href: '/posts' },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: '/about' },
  ] satisfies NavLink[],
  socials: [
    { label: 'GitHub', href: 'https://github.com/ngocsangyem' },
  ] satisfies SiteSocial[],
  /** Rendered in DM Mono under the social row. */
  email: 'nnsang24@gmail.com',
  /**
   * Home greeting, first person, one or two lines. The home page omits the
   * block entirely while this is empty; the design forbids stand-in copy.
   */
  greeting:
    "Hey! I’m a software engineer who enjoys turning ideas into thoughtful digital experiences. " +
    'I care about writing good code, building things that last, and constantly finding better ways to solve problems.  ' +
    'This blog is where I document what I learn along the way, from frontend engineering and code quality to tools, workflows, and the craft of building software. ' +
    'Think of it as a collection of things I’ve learned, built, broken, and figured out along the way.',
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
