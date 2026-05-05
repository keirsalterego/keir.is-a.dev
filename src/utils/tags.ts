import type { CollectionEntry } from "astro:content";

export const getTags = (articles: CollectionEntry<"blog">[]) => {
  const numarticlesPerTag = articles.reduce(
    (acc, post) => {
      post.data.tags?.forEach((tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const tags = Object.entries(numarticlesPerTag)
    .sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB))
    .map(([tag]) => tag);

  numarticlesPerTag["all"] = articles.length;

  return { tags, numarticlesPerTag };
};
