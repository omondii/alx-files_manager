/**
 * An express server client
 */
const express = require('express');
const app  = express();
const port = process.env.PORT || 5000;
import router from './routes/index';

router(app);

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});