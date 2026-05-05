export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get("vyrox_admin_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return new Response("Missing path", { status: 400 });

  const owner = import.meta.env.GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || "keirsalterego";
  const repo = import.meta.env.GITHUB_REPO_NAME || process.env.GITHUB_REPO_NAME || "keir.is-a.dev";

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Vyrox-CMS",
      },
    });

    if (!res.ok) return new Response("File not found", { status: 404 });

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");

    return new Response(JSON.stringify({ content }), { status: 200 });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};
