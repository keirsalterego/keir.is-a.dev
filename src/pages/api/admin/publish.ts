export const prerender = false;

import type { APIRoute } from "astro";

import { parse, stringify } from "yaml";

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get("vyrox_admin_token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized. Missing memory-safe credentials." }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { collection, title, slug, tags, isDraft, content, buildCategory, buildLink, buildIcon, buildRepo } = body;

    let path = "";
    let frontmatter = "";
    let isYamlAppend = false;

    if (collection === "articles") {
      path = `src/content/blog/${slug}.md`;
      frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
tags: ${JSON.stringify(tags || [])}
${isDraft ? "draft: true\n" : ""}---

`;
    } else if (collection === "journal") {
      path = `obsidian/journal/${slug}.md`;
      frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${slug.substring(0, 10)}
---

`;
    } else if (collection === "builds") {
      path = `src/content/builds/index.md`;
      isYamlAppend = true;
    } else if (collection === "now") {
      path = `src/content/now.md`;
      // For now.md, title is the month (e.g. "June 2026")
      frontmatter = `# ${title}\n\n`;
    } else if (collection === "about") {
      path = `src/content/about/index.md`;
      frontmatter = ""; 
    } else {
      return new Response(JSON.stringify({ error: "Invalid collection" }), { status: 400 });
    }

    const owner = import.meta.env.GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || "keirsalterego";
    const repo = import.meta.env.GITHUB_REPO_NAME || process.env.GITHUB_REPO_NAME || "keir.is-a.dev";

    // 1. Check if file exists to get SHA and existing content
    let sha = undefined;
    let existingContent = "";
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Vyrox-CMS",
      },
    });

    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
      if (getData.content) {
        existingContent = Buffer.from(getData.content, "base64").toString("utf8");
      }
    }

    let finalContent = "";
    if (isYamlAppend) {
      // Parse YAML from existing file
      const match = existingContent.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const yamlData = parse(match[1]);
        if (!yamlData.builds) yamlData.builds = {};
        if (!yamlData.builds[buildCategory]) yamlData.builds[buildCategory] = [];
        
        yamlData.builds[buildCategory].push({
          name: title,
          link: buildLink,
          desc: content,
          icon: buildIcon,
          tech: tags || [],
          repo: buildRepo
        });
        
        finalContent = "---\n" + stringify(yamlData) + "---\n" + existingContent.replace(/^---\n[\s\S]*?\n---/, "");
      } else {
        return new Response(JSON.stringify({ error: "Failed to parse builds YAML" }), { status: 500 });
      }
    } else if (collection === "now") {
      finalContent = frontmatter + content + "\n\n---\n\n" + existingContent;
    } else {
      finalContent = frontmatter + content;
    }

    const base64Content = Buffer.from(finalContent).toString("base64");

    // 2. Create or Update file
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Vyrox-CMS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Vyrox CMS: ${sha ? "Update" : "Publish"} ${path}`,
        content: base64Content,
        sha,
      }),
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return new Response(JSON.stringify({ error: errData.message || "GitHub API Error" }), { status: 500 });
    }

    const data = await putRes.json();
    return new Response(JSON.stringify({ success: true, commitUrl: data.commit.html_url }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
