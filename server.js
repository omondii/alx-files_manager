/**
 * An express server client
 */
const express = require('express');
const app  = express();
const port = process.env.PORT || 5000;

app.use(express.static(__dirname + '/routes/index.js'))

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});