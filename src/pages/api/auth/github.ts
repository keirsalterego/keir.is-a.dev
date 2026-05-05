export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = ({ redirect }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID is missing", { status: 500 });
  }

  // Request the 'repo' scope so we can commit files to the repository
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
  return redirect(url);
};
