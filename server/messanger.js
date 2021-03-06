const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const client = redis.createClient({ host: process.env.REDIS_HOST || 'localhost' });

// monogo init
const url = process.env.MONGO_HOST || 'mongodb://localhost:27017';
const mongoClient = new MongoClient(url);

mongoClient.connect((err) => {
  if (err) console.log(err);
  const db = mongoClient.db(process.env.MONGOCLIENT_DB);
  const messagingCollection = process.env.MESSAGES_COLLECTION;
  db.createCollection(messagingCollection).then(data => { console.log('success'); console.log(data) }).catch(err => console.log(err));

  // move app logic in here
  const app = express();
  app.use(bodyParser.json());
  // sorry for spelling wrong :(
  app.post('/messanger/postMessage', (req, res) => {
    console.log(req.body.message);
    const { productId } = req.body.message;
    db.collection(messagingCollection).deleteOne({ productId }).then(() => {
      db.collection(messagingCollection).insertOne(req.body.message)
        .then(() => {
          client.publish('testPublish', JSON.stringify({ ...req.body.message, type: 'message' }));
          res.send('ok')
        })
        .catch((e) => console.log(e));

    });

  });

  app.get('/messanger/getMessages', (req, res) => {
    const { id } = (req.query);
    if (id) {
      db.collection(messagingCollection).findOne({ productId: id })
        .then((result) => {
          res.send(result);
        })
        .catch((e) => console.log(e));
    } else res.sendStatus(404);

  });

  app.listen(process.env.MESSANGER_HOST || 5000);
  // end app logic
});

