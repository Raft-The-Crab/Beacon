export const onRequest: PagesFunction<{ MEDIA_API: string }> = async ({ request, params, env }) => {
  const url = new URL(request.url);
  const path = (params.path as string[] || []).join('/');
  const targetHost = env.MEDIA_API || 'https://media.beacon.qzz.io';
  const targetUrl = new URL(`${targetHost}/${path}${url.search}`);
  const newRequest = new Request(targetUrl.toString(), request);
  newRequest.headers.set('Host', new URL(targetHost).host);
  return fetch(newRequest);
};
