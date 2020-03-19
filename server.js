import express from 'express';
import bodyParser from 'body-parser';

import Movie from './models/movie';
import {
  search as moviessearch,
  index as moviesindex,
  show as moviesshow,
} from './routes/movies';
import { handleNotFound, handleInternalError } from './routes/errors';

const app = express();
const port = 3000;

app.use(bodyParser());
app.use(express.static(`${__dirname}/public`));

const movie = new Movie(process.env.API_KEY);

app.use((req, res, next) => {
  req.movie = movie;
  next();
});

app.get('/', moviessearch);
app.get('/movies', moviesindex);
app.get('/movies/:id', moviesshow);
app.all('*', handleNotFound);

app.use(handleInternalError);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
