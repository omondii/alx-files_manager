/**
 * MondoDb connector
 */
import mongodb from 'mongodb';
const { MongoClient } = require('mongodb');


class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const url = `mongodb://${host}:${port}/${database}`;

        this.client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
        this.client.connect()
            .then(() => console.log('Connected'))
            .catch(error => console.error('error'));      
    }

    isAlive() {
        return this.client.isConnected();
    }

    async nbUsers() {
        const count = await this.client.db().collection('files').countDocuments();
        return count;
    } catch (error) {
        console.error('Error');
        throw error;
    }

    async nbFiles() {
        try {
            const count = await this.client.db().collection('files').countDocuments();
            return count;
        } catch (error) {
            console.error('Error counting file documents:', error);
            throw error;
        }
    }
}

const dbClient = new DBClient();
export default dbClient;
