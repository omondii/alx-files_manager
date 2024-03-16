/**
 * Endpoint definitions for users
 */
const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  /**
     * Create a new user in the DB
     */
  static async postNew(request, response) {
    const userEmail = request.body.email;
    if (!userEmail) {
      return response.status(400).send({ error: 'Missing email' });
    }
    const userPwd = request.body.password;
    if (!userPwd) {
      return response.status(400).send({ error: 'Missing password' });
    }

    const emailCheck = await dbClient.db.collection('users')
      .findOne({ email: userEmail });
    if (!emailCheck) {
      const shaPassword = sha1(userPwd);
      const result = await dbClient.db
        .collection('users')
        .insertOne({ email: userEmail, password: shaPassword });

      return response.status(201).send({ id: result.insertedId, email: userEmail });
    }
    return response.status(400).send({ error: 'Already exist' });
  }

  /**
     * Retrieves the user based on the token
     */
  static async getMe(request, response) {
    const token = request.header('X-Token') || null;
    if (!token) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users')
      .findOne({ _id: ObjectId(redisToken) });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    delete user.password;
    return response.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
