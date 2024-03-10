/**
 * Endpoint definitions for users
 */
import sha1 from 'sha1';
import dbClient from '../utils/db';
import RedisClient from '../utils/redis';

class UsersController{
    static async postNew(request, response) {
        const userEmail = request.body.email;
        if (!userEmail){
            return response.status(400).send({error: 'Missing email'});
        }

        const userPwd = request.body.password;
        if (!userPwd){
            return response.status(400).send({error: 'Missing password'});
        }
        const emailCheck = await dbClient.db
          .collection('users')
          .findOne({email: userEmail});
        if (emailCheck){
            return response.status(400).send({error:  "Already exists"})
        }

        const shaPassword = sha1(userPwd);
        const result = await dbClient.db
          .collection('users')
          .insertOne({email: userEmail, password: shaPassword});

        return response.status(201).send({id: result.insertedId, email: userEmail});
    }
}

module.exports = UsersController;