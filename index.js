const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yhwb0.mongodb.net/?appName=Cluster0`;

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
        // await client.connect();

        const database = client.db('task');
        const eventsCollection = database.collection('events');
        const usersCollection = database.collection('user');
        const registrationsCollection = database.collection('registration');
        const reviewsCollection = database.collection('review');


        app.post("/users", async (req, res) => {
            const { name, email } = req.body;

            const existingUser = await usersCollection.findOne({ email });

            if (existingUser) {
                return res.send({ message: "User already exists" });
            }

            const newUser = {
                name,
                email,
                role: 'user',
                createdAt: new Date()
            };

            const result = await usersCollection.insertOne(newUser);

            res.send(result);
        });


        app.post("/events", async (req, res) => {
            const event = req.body;
            const result = await eventsCollection.insertOne(event);
            res.send(result);
        });

        app.get("/events", async (req, res) => {
            const events = await eventsCollection.find().toArray();
            res.send(events);
        });



        app.get("/events/:id", async (req, res) => {
            const { id } = req.params;
            const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

            if (!event) {
                return res.status(404).send({ message: "Event not found" });
            }

            res.send(event);
        });

        app.post("/registrations", async (req, res) => {
            const registration = req.body;

            if (!registration.eventId || !registration.email) {
                return res.status(400).send({ message: "Invalid data" });
            }

            const result = await registrationsCollection.insertOne(registration);
            res.send(result);
        });


        app.get("/my-bookings/:email", async (req, res) => {
            const email = req.params.email;

            try {

                const registrations = await registrationsCollection.find({ email }).toArray();


                const bookings = await Promise.all(
                    registrations.map(async (reg) => {
                        const event = await eventsCollection.findOne({ _id: new ObjectId(reg.eventId) });
                        return { ...reg, event };
                    })
                );

                res.send(bookings);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to fetch bookings" });
            }
        });

        app.delete("/registrations/:id", async (req, res) => {
            const { id } = req.params;
            const result = await registrationsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.post("/reviews", async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        });

        app.get('/reviews', async(req,res) => {
            const reviews  = await reviewsCollection.find().toArray();
            res.send(reviews);
        })



        app.patch("/users/:id", async (req, res) => {
            const { id } = req.params;
            const { role } = req.body;

            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { role } }
            );

            res.send(result);
        });

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email });
            if (!user) return res.status(404).send({ message: "User not found" });
            res.send(user);
        });

        // Get events by search

        app.get("/searched-events", async (req, res) => {
      const search = req.query.search?.trim(); 

      
      if (!search) return res.send([]);

      try {
        const events = await eventsCollection
          .find({ title: { $regex: search, $options: "i" } }) 
          .toArray();

        res.send(events);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch events" });
      }
    });




























        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Server is Running")
})


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})


