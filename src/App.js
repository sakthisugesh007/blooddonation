import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [donors, setDonors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    bloodGroup: "",
    contact: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false); // To track login status
  const [email, setEmail] = useState(""); // For login email
  const [password, setPassword] = useState(""); // For login password
  const [error, setError] = useState(""); // For error messages

  // Fetch donors on page load
  useEffect(() => {
    if (isLoggedIn) {
      fetchDonors();
    }
  }, [isLoggedIn]);

  // Fetch all donors
  const fetchDonors = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users/donors");
      setDonors(response.data);
    } catch (error) {
      console.error("Error fetching donors:", error);
    }
  };

  // Handle registration form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/users/register", form);
      alert("User registered successfully!");
      setForm({ name: "", email: "", bloodGroup: "", contact: "" });
      fetchDonors();
    } catch (error) {
      console.error("Error registering user:", error);
      alert("Failed to register user. Please try again.");
    }
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });
      if (response.data.success) {
        alert("Login successful!");
        setIsLoggedIn(true); // Set login status to true
        setError(""); // Clear any previous errors
      } else {
        setError("Invalid email or password");
      }
    } catch (error) {
      setError("An error occurred during login.");
      console.error("Login failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Blood Donation Platform</h1>

      {/* Login Form */}
      {!isLoggedIn ? (
        <div>
          <h2>Login</h2>
          <form onSubmit={handleLoginSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">Login</button>
          </form>
        </div>
      ) : (
        <div>
          {/* Registration Form (Visible after login) */}
          <h2>Register as Donor</h2>
          <form onSubmit={handleRegisterSubmit}>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Blood Group"
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            />
            <input
              type="text"
              placeholder="Contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <button type="submit">Register</button>
          </form>

          {/* Donor List */}
          <h2>List of Donors</h2>
          {donors.length > 0 ? (
            <ul>
              {donors.map((donor) => (
                <li key={donor._id}>
                  <strong>{donor.name}</strong> - {donor.bloodGroup} <br />
                  Contact: {donor.contact}
                </li>
              ))}
            </ul>
          ) : (
            <p>No donors available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
