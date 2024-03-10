/**
 * Endpoint definitions
 */
const express = require('express');
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
    static getStatus(request, response){
        const data = {
            redis: redisClient.isAlive(),
            db: dbClient.isAlive(),
        };
        return response.status(200).send(data);
    }

    static async getStats(request, response){
        const data = {
            users: await dbClient.nbUsers(),
            files: await dbClient.nbFiles(),
        };
        return response.status(200).send(data);
    }
}

module.exports = AppController;