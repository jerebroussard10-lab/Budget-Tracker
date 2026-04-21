const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try { body = await request.json(); } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (!body.key || body.key !== env.ADMIN_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { sha, content } = body;
    if (!sha || !content) {
      return new Response('Missing sha or content', { status: 400 });
    }

    const res = await fetch(
      `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/index.html`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'tst-admin-worker',
        },
        body: JSON.stringify({
          message: 'Admin: update site content',
          content,
          sha,
          branch: env.BRANCH || 'main',
        }),
      }
    );

    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};
