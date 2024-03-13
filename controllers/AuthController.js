/**
 * User authentication system
 */
const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(request, response) {
    /**
         * getConnect signs in a new user by generating a new auth token
         */
    const header = request.header('Authorization') || null;
    if (!header) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const credentials = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf-8').split(':');
    const email = credentials[0];
    const passwd = credentials[1];

    if (!email || !passwd) {
        return response.status(401).send({error: 'Unauthorized'});
    }
    const hashedpwd = sha1(passwd);

    const searchUser = await dbClient.db.collection('users')
      .findOne({ email, password: hashedpwd });
    if (!searchUser) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    const key = `auth_${token}`;

    // Store to redis using the Key for 24hrs
    await redisClient.set(key, searchUser._id.toString(), 86400);
    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    /**
         * Signs out user based on the auth token
         */
    const token = request.header('X-Token') || null;
    if (!token) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    // Delete the token in Redis
    await redisClient.del(`auth_${token}`);
    return response.status(204).send();
  }
}

module.exports = AuthController;
