/**
 * Files CRUD endpoints
 */
const Bull = require('bull');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  /**
     * Creates a new file in the DB and disk
     */
  static async postUpload(request, response) {
    const token = request.header('X-Token') || null;
    if (!token) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const fileQueue = new Bull('Queue');
    const user = await dbClient.db.collection('users')
      .findOne({ _id: ObjectId(redisToken) });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    // Check if name, type, parentId, ispublic and data are present
    const fileName = request.body.name;
    if (!fileName) {
      return response.status(400).send({ error: 'Missing name' });
    }
    const fileType = request.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) {
      return response.status(400).send({ error: 'Missing type' });
    }

    const publicFile = request.body.isPublic || false;
    let idParent = request.body.parentId || 0;

    const fileData = request.body.data;

    if (!fileData && ['file', 'image'].includes(fileType)) {
      return response.status(400).send({ error: 'Missing data' });
    }

    idParent = idParent === '0' ? 0 : idParent;
    if (idParent !== 0) {
      const parentFile = await dbClient.db.collection('files')
        .findOne({ _id: ObjectId(idParent) });
      if (!parentFile) {
        return response.status(400).send({ error: 'Parent not found' });
      }
      if (!['folder'].includes(parentFile.type)) {
        return response.status(400).send({ error: 'Parent is not a folder' });
      }
    }
    const dbFile = {
      userId: user._id,
      name: fileName,
      type: fileType,
      isPublic: publicFile,
      parentId: idParent,
    };

    if (['folder'].includes(fileType)) {
      await dbClient.db.collection('files').insertOne(dbFile);
      return response.status(201).send({
        id: dbFile._id,
        userId: dbFile.userId,
        name: dbFile.name,
        type: dbFile.type,
        isPublic: dbFile.isPublic,
        parentId: dbFile.parentId,
      });
    }
    const Dir = process.env.FOLDER_PATH || '/tmp/files/manager';
    const filename = uuidv4();
    const filePath = `${Dir}/${filename}`;

    await fs.mkdir(Dir, { recursive: true }, (error) => {
      if (error) {
        return response.status(400).send({ error: error.message });
      }
      return true;
    });
    dbFile.localPath = filePath;
    await dbClient.db.collection('files').insertOne(dbFile);

    // Add to redis queue using instantiated var

    fileQueue.add({
      userId: dbFile.userId,
      fileId: dbFile._id,
    });

    return response.status(201).send({
      id: dbFile._id,
      userId: dbFile.userId,
      name: dbFile.name,
      type: dbFile.type,
      isPublic: dbFile.isPublic,
      parentId: dbFile.parentId,
    });
  }

  /**
   * Retrieves a file document using its given id
   */
  static async getShow(request, response) {
    const token = request.header('X-Token') || null;
    if (!token) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const userSearch = await dbClient.db.collection('users')
      .findOne({ _id: ObjectId(redisToken) });
    if (!userSearch) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const fileId = request.params.id || '';
    const file = await dbClient.db.collection('files')
      .findOne({ _id: ObjectId(fileId) });
    if (!file) {
      return response.status(400).send({ error: 'Not found' });
    }
    return response.send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Retrieves all user file docs with a specific parentId;
   * with pagination
   */
  static async getIndex(request, response) {
    const token = request.header('X-Token') || null;
    if (!token) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const userSearch = await dbClient.db.collection('users')
      .findOne({ _id: ObjectId(redisToken) });
    if (!userSearch) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const parentId = request.query.parentId || 0;
    const pagination = request.query.page || 0;

    const aggregationMatch = { $and: [{ parentId }] };
    let aggregatedData = [
      { $match: aggregationMatch },
      { $skip: pagination * 20 },
      { $limit: 20 },
    ];
    if (parentId === 0) {
      aggregatedData = [{ $skip: pagination * 20 }, { $limit: 20 }];
    }
    const files = await dbClient.db.collection('files').aggregate(aggregatedData);
    const filesList = [];
    await files.forEach((item) => {
      const Item = {
        id: item._id,
        userId: item.userId,
        name: item.name,
        type: item.type,
        isPublic: item.isPublic,
        parentId: item.parentId,
      };
      filesList.push(Item);
    });
    return response.send(filesList);
  }
}

module.exports = FilesController;