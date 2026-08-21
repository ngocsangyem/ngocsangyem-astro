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
    "I'm Sang. These are my development notes: things I work out while building " +
    "for the web, written down so I don't have to work them out twice.",
  /** Author's own bio for /about. The page falls back to facts about the site. */
  bio: '' as string,
  repository: 'https://github.com/ngocsangyem/ngocsangyem-astro',
} as const;
