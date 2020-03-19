import express from 'express';
import crypto from 'crypto';

const app = express();
const port = 3000;

const handleEtag = (req, res, next) => {
  res.cachable = (options, isStaleCallback) => {
    let isJson;

    if (!options.etag && !options.content) {
      throw new Error(
        'Please provide either etag or content',
      );
    }

    if (options.etag) {
      res.set({ ETag: options.etag });
    } else {
      if (typeof options.content === 'object') {
        isJson = true;
        options.content = JSON.stringify(options.content);
      }

      const hash = crypto.createHash('md5');
      hash.update(options.content);
      res.set({ ETag: hash.digest('hex') });

      if (!isStaleCallback) {
        isStaleCallback = () => {
          if (isJson) {
            res.set({ 'Content-Type': 'application/json' });
          }
          res.send(options.content);
        };
      }
    }

    // 304 Not Modified
    if (req.fresh) {
      // remove content headers
      if (res._headers) {
        Object.keys(res._headers).forEach((header) => {
          if (header.indexOf('content') === 0) {
            res.removeHeader(header);
          }
        });
      }

      res.statusCode = 304;
      return res.end();
    }
    isStaleCallback();
  };

  next();
};

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/fruits/:id', handleEtag, (req, res, next) => {
  res.cachable({ content: { id: req.params.id } });
});

app.get('/apples/:id', handleEtag, (req, res, next) => {
  res.cachable({
    content: `apple with id ${req.params.id}`,
  });
});

app.get('/oranges/:id', handleEtag, (req, res, next) => {
  // ..
  const etag = 'AbcAsaDAAsD123';

  res.cachable({ etag }, () => {
    // ..
    res.send('I have an orange');
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
