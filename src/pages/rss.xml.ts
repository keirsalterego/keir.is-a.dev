import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@config";
import { getPostDate } from "@utils";

export async function GET() {
  const articles = await getCollection("blog", ({ data }) => !data.draft);

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: articles.map((item) => ({
      link: `articles/${item.id}`,
      title: item.data.title,
      pubDate: new Date(getPostDate(item.id))
    }))
  });
}
