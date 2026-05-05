export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get("vyrox_admin_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const owner = import.meta.env.GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || "keirsalterego";
  const repo = import.meta.env.GITHUB_REPO_NAME || process.env.GITHUB_REPO_NAME || "keir.is-a.dev";

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Vyrox-CMS",
      "Accept": "application/vnd.github.v3+json"
    };

    // Fetch Views
    const viewsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/traffic/views`, { headers });
    // Fetch Clones
    const clonesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/traffic/clones`, { headers });
    // Fetch Popular Paths
    const pathsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/traffic/popular/paths`, { headers });

    const [viewsData, clonesData, pathsData] = await Promise.all([
      viewsRes.ok ? viewsRes.json() : { count: 0, uniques: 0 },
      clonesRes.ok ? clonesRes.json() : { count: 0, uniques: 0 },
      pathsRes.ok ? pathsRes.json() : []
    ]);

    return new Response(JSON.stringify({ 
      views: viewsData,
      clones: clonesData,
      popularPaths: pathsData
    }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
