const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcrypt");

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit process if connection fails
  }
};

connectDB();

// User Schema Model
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Register Route
app.post("/api/users/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required", success: false });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully", success: true });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Failed to register user", success: false });
  }
});

// Login Route
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required", success: false });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist", success: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password", success: false });
    }

    res.status(200).json({ message: "Login successful", success: true });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Failed to login", success: false });
  }
});



// Donation Schema and Model
const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bloodGroup: { type: String},
    location: { type: String, required: true },
    phone:{ type: String},
  },
  { timestamps: true }
);

const Donation = mongoose.model("Donation", donationSchema);

// Availability Schema and Model
const availabilitySchema = new mongoose.Schema({
  bloodType: { type: String, required: true },
  availableUnits: { type: Number, required: true, default: 0 },
  location: { type: String, required: true },
  phone: { type: String},
});

// Ensure no duplicate bloodType in the same location
availabilitySchema.index({ bloodType: 1, location: 1 });

const Availability = mongoose.model("Availability", availabilitySchema);

// Donation Endpoint
app.post("/api/donations", async (req, res) => {
  console.log("Received Donation Data:", req.body);

  const { name, bloodGroup, location,phone } = req.body;

  if (!name || !bloodGroup || !location) {
    return res.status(400).json({ message: "All fields are required", success: false });
  }

  try {
    const newDonation = new Donation({ name, bloodGroup, location,phone });
    await newDonation.save();

    let availability = await Availability.findOne({ bloodType: bloodGroup, location });

    if (availability) {
      // If record exists, increment available units
      availability.availableUnits += 1;
      await availability.save();
    } else {
      // Try inserting a new record, but catch duplicate key error
      try {
        await new Availability({ bloodType: bloodGroup, availableUnits: 1, location, phone}).save();
      } catch (duplicateError) {
        if (duplicateError.code === 11000) {
          // Another request created the record, so we just update it
          availability = await Availability.findOne({ bloodType: bloodGroup, location, phone });
          if (availability) {
            availability.availableUnits += 1;
            await availability.save();
          }
        } else {
          throw duplicateError;
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Donation request added successfully and availability updated",
      donation: newDonation,
    });
  } catch (error) {
    console.error("Error saving donation:", error.message);
    res.status(500).json({ message: "Failed to save donation request", success: false });
  }
});


// Fetch Availability Route
app.get("/api/availability", async (req, res) => {
  try {
    const availability = await Availability.find();
    res.status(200).json({ success: true, availability });
  } catch (error) {
    console.error("Error fetching availability:", error.message);
    res.status(500).json({ message: "Failed to fetch availability", success: false });
  }
});

// Recipient Schema and Model
const recipientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    location: { type: String, required: true },
  },
  { timestamps: true }
);

const Recipient = mongoose.model("Recipient", recipientSchema);

// Recipient Endpoint
app.post("/api/recipient", async (req, res) => {
  const { name, bloodGroup, location } = req.body;

  if (!name || !bloodGroup || !location) {
    return res.status(400).json({ message: "All fields are required", success: false });
  }

  try {
    const availability = await Availability.findOne({ bloodType: bloodGroup, location });

    if (!availability || availability.availableUnits <= 0) {
      return res.status(400).json({ message: "Requested blood type is not available", success: false });
    }

    const newRecipient = new Recipient({ name, bloodGroup, location });
    await newRecipient.save();

    availability.availableUnits -= 1;
    await availability.save();

    res.status(201).json({
      success: true,
      message: "Recipient request added successfully and availability updated",
      recipient: newRecipient,
    });
  } catch (error) {
    console.error("Error saving recipient request:", error.message);
    res.status(500).json({ message: "Failed to save recipient request", success: false });
  }
});

// Fetch Recipient Requests with optional blood group filter
app.get("/api/recipient", async (req, res) => {
  const { bloodGroup } = req.query;

  try {
    const filter = bloodGroup ? { bloodGroup } : {};
    const recipients = await Recipient.find(filter);

    res.status(200).json({ success: true, recipients });
  } catch (error) {
    console.error("Error fetching recipient requests:", error.message);
    res.status(500).json({ message: "Failed to fetch recipient requests", success: false });
  }
});

// Start the Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



