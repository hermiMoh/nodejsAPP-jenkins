const express = require('express');
const app = express();

app.get('/add', (req, res) => {
  const a = parseFloat(req.query.a);
  const b = parseFloat(req.query.b);
  res.send({ result: a + b });
});

app.listen(3000, () => console.log('Calculator API running on port 3000'));
