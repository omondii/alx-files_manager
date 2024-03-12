/**
 * Express server controller
 */
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

const express = require('express');

const router = (app) => {
  const route = express.Router();
  app.use(express.json());
  app.use('/', route);

  route.get('/status', (request, response) => AppController.getStatus(request, response));
  route.get('/stats', (request, response) => AppController.getStats(request, response));
  route.post('/users', (request, response) => UsersController.postNew(request, response));
  route.get('/connect', (request, response) => AuthController.getConnect(request, response));
  route.get('disconnect', (request, response) => AuthController.getDisconnect(request, response));
  route.get('/users/me', (request, response) => UsersController.getMe(request, response));
};

module.exports = router;
