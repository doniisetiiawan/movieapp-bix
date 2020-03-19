import mdb from 'moviedb';
import errTo from 'errto';
import after from 'after';
import series from 'async-series';
import xtend from 'xtend';

class Movie {
  constructor(API_KEY) {
    if (!API_KEY) {
      throw new Error('API_KEY is required');
    }

    this.client = mdb(API_KEY);
    this.imagesPath = '';
    this.posterSizes = '';
  }

  getConfiguration(callback) {
    const that = this;

    if (!this.imagesPath) {
      this.client.configuration(
        errTo(callback, (config) => {
          that.imagesPath = config.images.base_url;
          that.posterSizes = config.images.poster_sizes;

          callback();
        }),
      );
    } else {
      process.nextTick(callback);
    }
  }

  getFullImagePath(relativePath, size) {
    if (!relativePath) {
      return '';
    }

    if (!size) {
      // default to smalles size
      size = this.posterSizes[0];
    } else {
      const index = this.posterSizes.indexOf(size);
      size = this.posterSizes[index];

      if (!size) {
        throw new Error('unknown image size');
      }
    }

    return this.imagesPath + size + relativePath;
  }

  search(title, callback) {
    const that = this;
    let movies = {};

    series(
      [
        (next) => {
          that.getConfiguration(next);
        },
        (next) => {
          that.client.searchMovie(
            { query: title },
            errTo(next, (mov) => {
              // convert relative to full path
              mov.results.forEach((movie) => {
                movie.poster_path = that.getFullImagePath(
                  movie.poster_path,
                );
              });

              movies = mov;

              next();
            }),
          );
        },
      ],
      errTo(callback, () => {
        callback(null, movies);
      }),
    );
  }

  getMovie(id, callback) {
    const that = this;

    this.client.movieInfo(
      { id },
      errTo(callback, (info) => {
        let movieInfo = info;
        let cast = {};
        let trailers = {};

        const done = after(
          2,
          errTo(callback, () => {
            movieInfo = xtend(movieInfo, {
              trailers,
              cast,
            });

            callback(null, movieInfo);
          }),
        );

        that.client.movieTrailers(
          { id },
          errTo(done, (trailerData) => {
            trailers = trailerData;

            done();
          }),
        );

        that.client.movieCredits(
          { id },
          errTo(done, (credits) => {
            const next = after(
              credits.cast.length,
              errTo(done, () => {
                that.getConfiguration(
                  errTo(done, () => {
                    movieInfo.poster_path = that.getFullImagePath(
                      movieInfo.poster_path,
                      'w185',
                    );

                    done();
                  }),
                );
              }),
            );

            cast = credits.cast;

            credits.cast.forEach((person) => {
              that.client.personInfo(
                { id: person.id },
                errTo(next, (personInfo) => {
                  // extend person with details
                  person.details = personInfo;

                  that.getConfiguration(
                    errTo(next, () => {
                      person.details.profile_path = that.getFullImagePath(
                        person.details.profile_path,
                      );
                      next();
                    }),
                  );
                }),
              );
            });
          }),
        );
      }),
    );
  }
}

export default Movie;
