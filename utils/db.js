/**
 * MondoDb connector
 */
const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        this.host = process.env.DB_HOST || 'localhost';
        this.port = process.env.DB_PORT || 27017;
        this.database = process.env.DB_DATABASE || 'files_manager';

        this.url = 'mongodb://host:port';
        this.client = new MongoClient(url);

        async function connector() {
            try{
                await this.client.connect();
                this.clientConnected = true;

            } catch (error) {
                this.clientConnected = false;
                console.error('Error, connection Failure!');
            }
        }
    }

    isAlive() {
        return this.clientConnected;
    }

    nbUsers() {
        
    }
}