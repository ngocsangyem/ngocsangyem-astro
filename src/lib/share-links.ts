/** Share targets for a post. Plain links: each opens the network's own form. */

export interface ShareInput {
  url: string;
  title: string;
}

export interface ShareLinks {
  x: string;
  linkedin: string;
  email: string;
}

export function shareLinks({ url, title }: ShareInput): ShareLinks {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    x: `https://x.com/intent/post?text=${t}&url=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    email: `mailto:?subject=${t}&body=${u}`,
  };
}
