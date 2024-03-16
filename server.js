/**
 * An express server client
 */
const express = require('express');
const router = require('./routes/index');

const app = express();
const port = process.env.PORT || 5000;

router(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
