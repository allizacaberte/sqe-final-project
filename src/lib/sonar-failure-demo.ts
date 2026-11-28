export function validateMovieRating(rating: number): boolean {
    return rating >= 1 && rating <= 10;
}