export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response("Missing GitHub OAuth credentials", { status: 500 });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return new Response("Failed to get access token", { status: 400 });
  }

  // Get user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Vyrox-CMS",
    },
  });

  const userData = await userRes.json();

  // The Bouncer
  if (userData.login !== "keirsalterego") {
    return new Response(
      `
      <html>
        <body style="background: #1d2021; color: #ebdbb2; font-family: monospace; padding: 3rem; text-align: center;">
          <h1 style="color: #fb4934;">[ 403 FORBIDDEN ]</h1>
          <p>Nice try, script kiddie.</p>
          <p>This is a memory-safe zone. Your unauthorized access attempt as <strong>${userData.login}</strong> has been logged and sent to /dev/null.</p>
          <p>Go back to <a href="/" style="color: #83a598;">safety</a>.</p>
        </body>
      </html>
      `,
      {
        status: 403,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // Success! Store the token in a secure, HTTP-only cookie.
  // We use the token itself so we can make GitHub API calls from the server on behalf of the user.
  cookies.set("vyrox_admin_token", accessToken, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD || process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return redirect("/admin");
};
