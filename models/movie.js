import mdb from 'moviedb';

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
      this.client.configuration((err, config) => {
        if (err) {
          return callback(err);
        }

        that.imagesPath = config.images.base_url;
        that.posterSizes = config.images.poster_sizes;

        callback();
      });
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

    this.getConfiguration((err) => {
      if (err) {
        return callback(err);
      }

      that.client.searchMovie(
        { query: title },
        (err, movies) => {
          if (err) {
            return callback(err);
          }

          // convert relative to full path
          movies.results.forEach((movie) => {
            movie.poster_path = that.getFullImagePath(
              movie.poster_path,
            );
          });

          callback(null, movies);
        },
      );
    });
  }

  getMovie(id, callback) {
    const that = this;

    this.client.movieInfo({ id }, (err, info) => {
      if (err) {
        return callback(err);
      }

      const movieInfo = info;
      let cast = {};
      let trailers = {};

      let doneCalled = false;
      let tasksCount = 2;
      const done = (err) => {
        if (doneCalled) {
          return;
        }

        if (err) {
          doneCalled = true;
          return callback(err);
        }

        tasksCount--;

        if (tasksCount === 0) {
          movieInfo.trailers = trailers;
          movieInfo.cast = cast;

          callback(null, movieInfo);
        }
      };

      that.client.movieTrailers(
        { id },
        (err, trailerData) => {
          if (err) {
            return done(err);
          }

          trailers = trailerData;

          done();
        },
      );

      that.client.movieCredits({ id }, (err, credits) => {
        let called = false;

        const cb = (err) => {
          if (called) {
            return;
          }

          if (err) {
            called = true;
            return done(err);
          }

          let count = credits.cast.length;

          count--;

          if (count === 0) {
            that.getConfiguration((err) => {
              if (err) {
                return done(err);
              }

              movieInfo.poster_path = that.getFullImagePath(
                movieInfo.poster_path,
                'w185',
              );

              done();
            });
          }
        };

        if (err) {
          return cb(err);
        }

        cast = credits.cast;

        credits.cast.forEach((person) => {
          that.client.personInfo(
            { id: person.id },
            (err, personInfo) => {
              if (err) {
                return cb(err);
              }

              // extend person with details
              person.details = personInfo;
              that.getConfiguration((err) => {
                if (err) {
                  return cb(err);
                }

                person.details.profile_path = that.getFullImagePath(
                  person.details.profile_path,
                );
                cb();
              });
            },
          );
        });
      });
    });
  }
}

export default Movie;
