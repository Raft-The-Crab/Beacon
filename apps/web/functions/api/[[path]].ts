export const onRequest: PagesFunction<{ BACKEND_URL: string }> = async ({ request, params, env }) => {
  const url = new URL(request.url);
  const path = (params.path as string[]).join('/');
  // Fallback to current Railway URL if no env variable is set
  const backendUrl = env.BACKEND_URL || 'https://beacon-v1-api.up.railway.app';
  
  // Construct the target URL (pointing to the /api suffix of the backend)
  const targetUrl = new URL(`${backendUrl}/api/${path}${url.search}`);
  
  // Clone the request with the new URL
  const newRequest = new Request(targetUrl.toString(), request);
  
  // Ensure the Host header matches the target
  newRequest.headers.set('Host', new URL(backendUrl).host);
  
  // Allow all origins for the proxy (CORS becomes internal to Cloudflare)
  const response = await fetch(newRequest);
  
  // Create a new response to modify headers if needed
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return newResponse;
};
