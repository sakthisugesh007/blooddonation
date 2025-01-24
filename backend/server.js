const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Initialize environment variables
dotenv.config();

// Create the app and define the port
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI,)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Donor Schema
const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bloodGroup: { type: String, required: true },
  contact: { type: String, required: true },
});

// Donor Model
const Donor = mongoose.model("Donor", donorSchema);

// Routes

// Fetch all donors
app.get("/api/users/donors", async (req, res) => {
  try {
    const donors = await Donor.find();
    res.status(200).json(donors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch donors" });
  }
});

// Register a new donor
app.post("/api/users/register", async (req, res) => {
  const { name, email, bloodGroup, contact } = req.body;

  try {
    const newDonor = new Donor({ name, email, bloodGroup, contact });
    await newDonor.save();
    res.status(201).json(newDonor);
  } catch (error) {
    res.status(500).json({ error: "Failed to register donor" });
  }
});

// Delete a donor (optional)
app.delete("/api/users/delete/:id", async (req, res) => {
  try {
    await Donor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Donor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete donor" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
