import { getCollection, type CollectionEntry } from "astro:content";

export const getPostDate = (id: string) => id.split("/").pop()!.substring(0, 10);

export const getarticles = async () => {
  const articles = await getCollection("blog");

  return articles.filter(({ data }) => !data.draft);
};

export const getSortedarticles = (articles: CollectionEntry<"blog">[]) =>
  articles.sort((a, b) => getPostDate(b.id).localeCompare(getPostDate(a.id)));

export const getSortedarticlesByYear = (articles: CollectionEntry<"blog">[]) => {
  const sortedarticles = getSortedarticles(articles);

  return sortedarticles.reduce(
    (acc, post) => {
      const year = getPostDate(post.id).slice(0, 4);
      (acc[year] ||= []).push(post);
      return acc;
    },
    {} as Record<string, CollectionEntry<"blog">[]>
  );
};

export const getarticlesByTag = (articles: CollectionEntry<"blog">[], tag: string) =>
  articles.filter((post) => post.data.tags?.includes(tag));
