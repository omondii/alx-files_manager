/**
 * Redis client
 */
const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.clientConnected = true;
    this.getAsync = promisify(this.client.get).bind(this.client);

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
   * stored for this key
   */
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * takes a string key, a value and a duration in second as
   * arguments to store it in Redis
   * @param {string} key
   * @param {string} value
   * @param {int} time
   * @returns {string} value
   */
  async set(key, value, time) {
    this.client.set(key, value);
    this.client.expire(key, time);
  }

  /**
   * that takes a string key as argument and remove the value in Redis
   * or this key
   * @param {string} key
   * @returns {string} null
   */
  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
