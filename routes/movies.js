import errTo from 'errto';
import Err from 'custom-err';

export function search(req, res, next) {
  res.send({
    pageTitle: 'Search for movies',
  });
}

export function index(req, res, next) {
  if (!req.query.title) {
    return next(Err('Missing search param', { code: 422 }));
  }

  req.movie.search(
    req.query.title,
    errTo(next, (movies) => {
      res.send({
        pageTitle: `Search results for ${req.query.title}`,
        movies,
      });
    }),
  );
}

export function show(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return next(Err('Bad movie id', { code: 422 }));
  }

  req.movie.getMovie(
    req.params.id,
    errTo(next, (movie) => {
      res.send({ pageTitle: movie.title, movie });
    }),
  );
}
