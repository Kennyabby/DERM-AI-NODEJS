const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const apiPort = 3001
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const { useEndecrypt } = require('./algorithms/useEndecrypt.js')
var propList = []
var array = {}
var updated = false
var delivered = false
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


// var corsOptions = {
//   origin: 'https://exploredermai.herokuapp.com',
//   optionsSuccessStatus: 200 // some legacy browsers (Ie11, various SmartTVs) choke on 204
// }

var whitelist =['http://localhost:3000','https://exploredermai.herokuapp.com']
var corsOptions = {
  origin: function (origin, callback){
    if (whitelist.indexOf(origin)!==-1){
      console.log('origin accepted')
      callback(null, true)
    }else{
      console.log('origin rejected')
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions))
app.post('/postUserDetails', async (req, res) => {
  const user = await req.body
  await main(
    (func = 'createDoc'),
    (database = 'dermai'),
    (collection = 'dermaiUsers'),
    (data = user)
  ).catch(console.error)
  res.json({
    delivered: delivered,
  })
})

app.post('/getEmailList', async (req, res) => {
  await main(
    (func = 'findDocprop'),
    (database = 'dermai'),
    (collection = 'dermaiUsers'),
    (data = req.body)
  )
    .catch(console.error)
    .then(() => {
      var list = propList.map((obj) => {
        return obj.email
      })
      res.json({
        emailList: list,
      })
    })
})

app.post('/getUserDetails', async (req, res) => {
  await main(
    (func = 'findOne'),
    (database = 'dermai'),
    (collection = 'dermaiUsers'),
    (data =
      req.body.email !== undefined ? req.body : { _id: ObjectId(req.body._id) })
  )
    .catch(console.error)
    .then(() => {
      res.json({
        user: array[0],
      })
    })
})
app.post('/getUsersDetails', async (req, res) => {
  await main(
    (func = 'findMany'),
    (database = 'dermai'),
    (collection = 'dermaiUsers'),
    (data = req.body)
  )
    .catch(console.error)
    .then(() => {
      res.json({
        users: array,
      })
    })
})

app.post('/updateOneUser', async (req, res) => {
  await main(
    (func = 'updateOne'),
    (database = 'dermai'),
    (collection = 'dermaiUsers'),
    (data = req.body.prop)
  )
    .catch(console.error)
    .then(() => {
      res.json({
        updated: updated,
      })
    })
})
app.post('/updateOneDoc', async (req, res) => {
  await main(
    (func = 'updateOne'),
    (database = 'dermai'),
    (collection = req.body.collection),
    (data = req.body.prop)
  )
    .catch(console.error)
    .then(() => {
      res.json({
        updated: updated,
      })
    })
})
app.post('/getpassList', async (req, res) => {
  await main(
    (func = 'findOne'),
    (database = 'dermai'),
    (collection = 'dermaiUsers'),
    (data = req.body)
  )
    .catch(console.error)
    .then(() => {
      if (array[0] !== undefined && array[0] !== null) {
        res.json({
          id: array[0]._id,
          password: array[0].password,
        })
      } else {
        res.json({
          id: '',
          password: '',
        })
      }
    })
})

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))

const main = async (func, database, collection, data, limit) => {
  //const uri = 'mongodb://localhost:27017'
  const uri = 'mongodb+srv://kennyabby:kennypro@20@cluster0.nm56r.mongodb.net/?retryWrites=true&w=majority'
  const client = new MongoClient(uri, { useNewUrlParser: true })

  const listDatabases = async () => {
    const databaseList = await client.db().admin().listDatabases()
    databaseList.databases.forEach((db) => console.log(` - ${db.name}`))
  }
  const createDoc = async (database, collection, data) => {
    delivered = false
    const result = await client
      .db(database)
      .collection(collection)
      .insertOne(data)
    delivered = true
  }
  const removeDoc = async (database, collection, data) => {
    const result = await client
      .db(database)
      .collection(collection)
      .deleteOne(data)
  }
  const findDocprop = async (database, collection, data) => {
    const result = await client
      .db(database)
      .collection(collection)
      .find({}, { projection: { ...data } })
    var prop = await result.toArray()
    propList = []
    for (var i = 0; i < prop.length; i++) {
      propList = propList.concat(prop[i])
    }
  }

  const findOne = async (database, collection, data) => {
    const result = await client
      .db(database)
      .collection(collection)
      .findOne({ ...data })
    array = await [result]
  }
  const findMany = async (database, collection, data) => {
    const result = await client
      .db(database)
      .collection(collection)
      .find({ ...data })
      .sort({ createdAt: -1 })
    array = await result.toArray()
  }
  const limitFindMany = async (database, collection, data, limit) => {
    const result = await client
      .db(database)
      .collection(collection)
      .find({ ...data })
      .sort({ createdAt: -1 })
      .limit(limit)
    array = await result.toArray()
  }
  const updateOne = async (database, collection, data) => {
    updated = false
    const result = await client
      .db(database)
      .collection(collection)
      .updateOne(data[0], { $set: data[1] })
    updated = true
  }
  try {
    await client.connect()
    if (func === 'listDatabases') {
      await listDatabases(client)
    }
    if (func === 'createDoc') {
      await createDoc(database, collection, data)
    }
    if (func === 'removeDoc') {
      await removeDoc(database, collection, data)
    }
    if (func === 'findDocprop') {
      await findDocprop(database, collection, data)
    }
    if (func === 'findOne') {
      await findOne(database, collection, data)
    }
    if (func === 'findMany') {
      await findMany(database, collection, data)
    }
    if (func === 'limitFindMany') {
      await limitFindMany(database, collection, data, limit)
    }
    if (func === 'updateOne') {
      await updateOne(database, collection, data)
    }
  } catch (e) {
    console.error(e)
  } finally {
    await client.close()
  }
}
