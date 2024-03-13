/**
 * Endpoint definitions
 */
const dbClient = require('../utils/db');
const RedisClient = require('../utils/redis');

class AppController {
  /**
   * Checks and returns the connectivity status of redis and mongo
   */
  static getStatus(request, response) {
    const data = {
      redis: RedisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    return response.status(200).send(data);
  }

  static async getStats(request, response) {
    const data = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    return response.status(200).send(data);
  }
}

module.exports = AppController;
