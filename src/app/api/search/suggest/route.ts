import { suggestMovies } from "@/lib/tmdb";

// GET /api/search/suggest?q=ava  →  [{ id, title, year, poster }, ...]
// Called by the navbar search box while the user types.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";

  try {
    return Response.json(await suggestMovies(q.slice(0, 100)));
  } catch {
    // If TMDB is down, just show no suggestions instead of breaking the search box
    return Response.json([], { status: 502 });
  }
}
