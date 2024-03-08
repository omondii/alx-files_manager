/**
 *contains the redis client
 */
const redis = require('redis');
import { createClient } from 'redis';
const util = require('util');


class RedisClient {
    constructor() {
	this.client = createClient();
	this.clientConnected = true;

	this.client.on('error', (err) => {
	    console.error(err);
		this.clientConnected = false;
		});
	this.client.on('connect', () => {
		this.clientConnected = true;
	});
    }

	/**
	 * Checks if client connection is successful or failed
	 * @returns {boolean}
	 */
	isAlive() {
		return this.clientConnected;
	}

	/**
	 * takes a string key as argument and returns the Redis value
	 * 		stored for this key
	 */
	async get(key) {
		var getAsync = util.promisify(this.client.get).bind(this.client);
		try {
			const value = await getAsync(key);
			return value;
		} catch (error) {
			return;
		}
	}

	/**
	 * takes a string key, a value and a duration in second as
	 * 		arguments to store it in Redis
	 * @param {string} key 
	 * @param {string} value 
	 * @param {int} time 
	 * @returns 
	 */
	async set(key, value, time){
		var setAsync = util.promisify(this.client.set).bind(this.client);
		try{
			await setAsync(key, value, 'EX', time);
			return value
		} catch (error) {
			return
		}
	}

	/**
	 * that takes a string key as argument and remove the value in Redis
	 * 		for this key
	 * @param {string} key 
	 * @returns 
	 */
	async del(key) {
		var delAsync = util.promisify(this.client.del).bind(this.client);
		try {
			await delAsync(key)
			return null
		} catch (error) {
			return
		}
	}
}

export const redisClient = new RedisClient();
export default redisClient;
