export function GET() {
  // Use an empty 200 response for the optional favicon endpoint.
  // Some hosting/runtime adapters reject 204 responses from route handlers.
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
