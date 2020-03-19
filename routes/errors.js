import STATUS_CODES from 'builtin-status-codes';

// 500 - Internal Server Error
export function handleInternalError(err, req, res, next) {
  let html = '';

  if (err.code === 404 || /not found/.test(err.message)) {
    return exports.handleNotFound(req, res, next);
  }
  if (err.code && STATUS_CODES[err.code]) {
    html = `<h1>${err.code} - ${
      STATUS_CODES[err.code]
    }</h1>`;
    html += `<p>${err.message}</p>`;

    res.send(err.code, html);
  } else {
    console.error(err.stack);
    res.send(500, '<h1>500 - Internal Server Error</h1>');
  }
}

export function handleNotFound(req, res, next) {
  res.send(404, '<h1>404 - Page Not Found</h1>');
}
