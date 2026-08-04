export function isCmsAvailable() {
  return process.env.VERCEL !== '1';
}

export function cmsUnavailableResponse() {
  return new Response(null, { status: 404 });
}
