import { describe, it, expect } from 'vitest';

import {
  movies,
  recentlyAddedMovies,
  topPickMovies,
} from '../app/data/movies';

describe('Movie Categorization', () => {
  it('returns movies categorized as recently added', () => {
    expect(recentlyAddedMovies.length).toBeGreaterThan(0);

    expect(
      recentlyAddedMovies.every(
        (movie) => movie.category === 'recently-added'
      )
    ).toBe(true);
  });

  it('returns movies categorized as top picks', () => {
    expect(topPickMovies.length).toBeGreaterThan(0);

    expect(
      topPickMovies.every(
        (movie) => movie.category === 'top-picks'
      )
    ).toBe(true);
  });

  it('does not include top picks in recently added movies', () => {
    const recentlyAddedIds = recentlyAddedMovies.map(
      (movie) => movie.id
    );

    const overlappingMovies = topPickMovies.filter(
      (movie) => recentlyAddedIds.includes(movie.id)
    );

    expect(overlappingMovies).toHaveLength(0);
  });

  it('categorizes all movies without losing any entries', () => {
    expect(
      recentlyAddedMovies.length + topPickMovies.length
    ).toBe(movies.length);
  });
});