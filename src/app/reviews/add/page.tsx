import { redirect } from "next/navigation";

// Old placeholder route. Reviews are written from a movie's page now,
// so send people to search to pick a movie first.
export default function AddReviewPage() {
  redirect("/search");
}
