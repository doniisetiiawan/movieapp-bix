export function search(req, res, next) {
  res.send({
    pageTitle: 'Search for movies',
  });
}

export function index(req, res, next) {
  if (!req.query.title) {
    const err = new Error('Missing search param');
    err.code = 422;
    return next(err);
  }

  req.movie.search(req.query.title, (err, movies) => {
    if (err) {
      return next(err);
    }

    res.send({
      pageTitle: `Search results for ${req.query.title}`,
      movies,
    });
  });
}

export function show(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    const err = new Error('Bad movie id');
    err.code = 422;
    return next(err);
  }

  req.movie.getMovie(req.params.id, (err, movie) => {
    if (err) {
      return next(err);
    }

    res.send({
      pageTitle: movie.title,
      movie,
    });
  });
}
