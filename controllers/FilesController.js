/**
 * Files CRUD endpoints
 */
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { PassThrough } = require('stream');

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
    const { parentId, page } = request.query;
    const parentFolderId = parentId ? parseInt(parentId): 0;

    // Pagination settings
    const itemsPerPage = 20;
    const skip = page ? parseInt(page) * itemsPerPage : 0;

    const allFiles = await dbClient.db.collection('files')
      .find({ userId: ObjectId(userSearch._id) })
        .skip(skip).limit(itemsPerPage).toArray();
    const allFilesList = allFiles.map(item => ({
      id: item._id,
      userId: item.userId,
      name: item.name,
      type: item.type,
      isPublic: item.isPublic,
      parentId: item.parentId,
    }));
    return response.send(allFilesList)
  }
  /**
   * Should Set the isPublic to true on the file doc based on ID
   */
  static async putPublish(request, response){
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
    var docs = await dbClient.db.collection('files')
      .find({ userId: ObjectId(userSearch._id), _id: ObjectId(fileId)});
    if (!docs){
      return response.status(404).send({ error: 'Not found' });
    }
    await dbClient.collection('files')
      .update({ _id: ObjectId(idFile) }, { $set: { isPublic: true } });
    docs = await dbClient.db.collection('files')
      .findOne({ _id: ObjectId(fileId), userId: userSearch._id});

    return response.send({
      id: docs._id,
      userId: docs.userId,
      name: docs.name,
      type: docs.type,
      isPublic: docs.isPublic,
      parentId: docs.parentId,
    });
  }
  static async putUnpublish(request, response){
    return
  }
}

module.exports = FilesController;
