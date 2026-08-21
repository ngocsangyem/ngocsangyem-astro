import { describe, expect, it } from 'vitest';
import type { MdastNode } from 'satteri';

// The real implementation, so a behaviour change fails these tests.
import { findRoot } from './mdast-reading-time';

describe('mdast-reading-time', () => {
  describe('findRoot', () => {
    it('returns the node itself if it has no parent', () => {
      const node = { type: 'root' } as unknown as MdastNode;
      const root = findRoot(node, () => undefined);
      expect(root).toBe(node);
    });

    it('traverses up to find the root when given a leaf node', () => {
      const parentNode = { type: 'parent' } as unknown as MdastNode;
      const childNode = { type: 'child' } as unknown as MdastNode;
      const root = findRoot(childNode, (n) => (n === childNode ? parentNode : undefined));
      expect(root).toBe(parentNode);
    });

    it('traverses multiple levels to find the root', () => {
      const rootNode = { type: 'root' } as unknown as MdastNode;
      const middleNode = { type: 'middle' } as unknown as MdastNode;
      const leafNode = { type: 'leaf' } as unknown as MdastNode;

      const getParent = (n: Readonly<MdastNode>) => {
        if (n === leafNode) return middleNode;
        if (n === middleNode) return rootNode;
        return undefined;
      };

      const result = findRoot(leafNode, getParent);
      expect(result).toBe(rootNode);
    });

    it('handles deep nesting', () => {
      const nodes = Array.from({ length: 10 }, (_, i) =>
        ({ type: `level-${i}` } as unknown as MdastNode),
      );

      const getParent = (n: Readonly<MdastNode>) => {
        const index = nodes.indexOf(n as MdastNode);
        return index > 0 ? nodes[index - 1] : undefined;
      };

      const result = findRoot(nodes[nodes.length - 1]!, getParent);
      expect(result).toBe(nodes[0]);
    });

    it('stops traversal when getParent returns undefined', () => {
      const level2 = { type: 'level2' } as unknown as MdastNode;
      const level1 = { type: 'level1' } as unknown as MdastNode;
      const level0 = { type: 'level0' } as unknown as MdastNode;

      const getParent = (n: Readonly<MdastNode>) => {
        if (n === level2) return level1;
        if (n === level1) return level0;
        // level0 has no parent, traversal stops here
        return undefined;
      };

      const result = findRoot(level2, getParent);
      // Should return level0, not continue past undefined
      expect(result).toBe(level0);
    });
  });
});
