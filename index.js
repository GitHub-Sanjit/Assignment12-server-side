const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();
// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  console.log("token inside jwt", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.send(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const usersCollection = client.db("carResale").collection("users");
    const productsCollection = client.db("carResale").collection("products");

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "2h",
        });
        return res.send({ accessToken: token });
      }
      console.log(user);
      res.status(403).send({ accessToken: "" });
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.get("/users/seller/", async (req, res) => {
      const role = req.params.role;
      const query = { role: "seller" };
      const user = await usersCollection.findOne(query);
      console.log(user);
      res.send(user);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.put("/users/admin/:id", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/productsCategories", async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const productsCategories = await cursor.toArray();
      res.send(productsCategories);
    });

    app.get("/productsCategories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const category = await productsCollection.findOne(query);
      res.send(category);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
  res.send("Car Resale Server is Running");
});

app.listen(port, () => {
  console.log(`Car Resale Running on port ${port}`);
});
