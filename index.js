const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//::::::::: middleware ::::::::::::
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());



// ::::::::: created middlewares :::::::::::
const logger = async(req, res, next) =>{
  console.log('called', req.host, req.originalUrl);
  next();
}


const verifyToken = async(req, res, next) =>{
  const token = req.cookies?.token;
  console.log('value of token in middleware', token)
  if(!token){
    return res.status(401).send({message: 'not authorized'});
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
    // error
    if(error){
      console.log(error)
      return res.status(401).send({message: 'unauthorized'})
    }

    // if token is valid then it would be decoded
    console.log('value in the token', decoded)
    req.user = decoded;
  })
  next()
}




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


    //:::::::::: auth related api ::::::::::::

    app.post("/jwt", logger, async(req, res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
     
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
        

      })
      .send({success: true});
    })

   

    //::::::::::: service related api ::::::::::::::
    app.get("/services", logger, async(req, res)=>{
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

    app.get("/orders", logger, verifyToken, async(req, res) =>{
      console.log(req.query.email)
      // console.log('tok tok token', req.cookies.token)
      console.log('user in the valid token', req.user)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'})
      }
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
