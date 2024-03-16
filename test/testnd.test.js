import MongoClient from 'mongodb';
import chai from 'chai';
import dbClient from '../utils/db.js';


describe('dbClient test', () => {  
    let testClientDb = null;

    beforeEach(async () => {
        const dbInfo = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '27017',
            database: process.env.DB_DATABASE || 'files_manager'
        };
        const mcPromise = () => {
            return new Promise((resolve, reject) => {
                MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`, (err, client) => {
                    if (err) {
                        reject();
                    }
                    else {
                        resolve(client.db(dbInfo.database))
                    }
                });
            }); 
        };
        testClientDb = await mcPromise();
        await testClientDb.collection('users').deleteMany({})
        await testClientDb.collection('users').insertOne({ email: "me@me.com" })

        const waitConnection = () => {
            return new Promise((resolve, reject) => {
                let i = 0;
                const repeatFct = async () => {
                    await setTimeout(() => {
                        i += 1;
                        if (i >= 5) {
                            reject()
                        }
                        else if(!dbClient.isAlive()) {
                            repeatFct()
                        }
                        else {
                            resolve()
                        }
                    }, 1000);
                }
                repeatFct();
            })
        };
        await waitConnection();
    });
        
    afterEach(async () => {
    });

    it('nbUsers for a collection with one document', async () => {
        chai.assert.equal(await dbClient.nbUsers(), 1);  
    })
});
