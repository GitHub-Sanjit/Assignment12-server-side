const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();

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
client.connect((err) => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

app.get("/", async (req, res) => {
  res.send("Car Resale Server is Running");
});

app.listen(port, () => {
  console.log(`Car Resale Running on port ${port}`);
});
