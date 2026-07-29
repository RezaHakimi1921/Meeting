/**
 * Transparent reverse proxy to api.telegram.org
 * Only /bot* paths are allowed. No logging of URLs/bodies (token may be in path).
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/bot')) {
      return new Response('Not allowed', { status: 403 });
    }

    const telegramUrl = 'https://api.telegram.org' + url.pathname + url.search;

    const init = {
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }

    const response = await fetch(telegramUrl, init);

    // Strip hop-by-hop headers that can break clients
    const headers = new Headers(response.headers);
    headers.delete('content-encoding');
    headers.delete('transfer-encoding');
    headers.delete('cf-ray');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
