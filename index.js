const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcynqnr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('carDoctor').collection('services');
    const ordersCollection = client.db('carDoctor').collection('orders');

    app.get("/services", async(req, res)=>{
        const cursor = servicesCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get("/services/:id", async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const options = {
           projection: { _id: 1, title: 1, img: 1, price: 1 },
          };
        const result = await servicesCollection.findOne(query, options);
        res.send(result);
    })

    app.post("/orders", async(req, res) =>{
      const order = req.body;
      console.log(order);
      const result = await ordersCollection.insertOne(order);
      res.send(result)
    })

    app.get("/orders", async(req, res) =>{
      console.log(req.query.email)
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    })

    app.patch("/orders/:id", async(req, res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedBooking = req.body;
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };

      const result = await ordersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.delete("/orders/:id", async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    })

  

                                   




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get("/", (req, res)=>{
    res.send("Car Doctor server is running")
})

app.listen(port, () =>{
    console.log(`Car doctor server is running on port: ${port}`)
})


// carDoctor
// nSyi8xw1ih5wBlX9