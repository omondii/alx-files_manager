const express = require('express');

import AppController from '../controllers/AppController';

const router = (app) => {
    const route = express.Router();
    app.use('/', route)

    route.get('/status', (request, response) => AppController.getStatus(request, response));
    route.get('/stats', (request, response) => AppController.getStats(request, response));
};

export default router;
