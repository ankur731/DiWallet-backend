const express = require("express");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "ankur@123";
const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const axios = require("axios");
require('dotenv').config();


const stripe = require("stripe")(process.env.STRIPE_KEY);
const router = express.Router();

router.get("/:id", async function (req, res) {
  try {
      const { id } = req.params;
      const user = await User.findById(id)
      if (!user) {
          return res.status(500).json({ status: "false", msg:"No user found" });
      }
      res.status(200).json({ status: "true", data: user });
      
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ status: "false", msg: "Server error", error: error.message });
  }
});


router.post("/payment", async (req, res) => {
  try {
    console.log(process.env.STRIPE_KEY)
    let { amount, userId } = req.body;
    console.log(req.body);
    // Simple validation
    if (!amount || !userId)
      return res.status(400).json({ message: "All fields are required" });
    amount = parseInt(amount);

    const user = await User.findById(userId);
    // Initiate payment
    const customer = await stripe.customers.create({
      name: user.fullName,
      address: {
        line1: "510 Townsend St",
        postal_code: "98140",
        city: "San Francisco",
        state: "CA",
        country: "US",
      },
    });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in the smallest currency unit
      currency: "INR", // Or "INR" for domestic transactions
      payment_method_types: ["card"], // For India, "card" or "upi" can be used
      metadata: {
        order_id: "6735", // Any other relevant metadata
        name: "Software development services", // Description of the service/product
      },
      customer: customer.id, // Attaching the customer
      description : "Software development services", // Required description field
      statement_descriptor_suffix: "DIWALLET PAYMENT", // Custom statement descriptor
      receipt_email: user.email, // The email where the receipt will be sent
      shipping: {
        name: user.fullName,
        address: {
          line1: "510 Townsend St",
          postal_code: "98140",
          city: "San Francisco",
          state: "CA",
          country: "US",
        },
      },
    });
    
    // Extracting the client secret
    const clientSecret = paymentIntent.client_secret;
    // Sending the client secret as response
    res
      .status(200)
      .json({
        message: "Payment initiated",
        clientSecret,
        publishableKey:
          "pk_test_51PCHBhSJRtzJJuBTNPFHT6ZAiMLogYAYW87bMFau9dlIvCdC1V4Mur9Id4shvqBi2QW3lyNn00BMWuv5yGH2yPF500gUtCiLDu",
      });
  } catch (err) {
    console.log(err);
  }
});

router.post("/deposit", async (req, res) => {
  try {
    let { amount, userId } = req.body;
    console.log(req.body);
    // Simple validation
    if (!amount || !userId)
      return res.status(400).json({ message: "All fields are required" });
    amount = parseInt(amount);


    const user = await User.findById(userId);
    user.balanceAmount += amount
    

    user.transactions.push({
      type: "deposit",
      amount:amount,
      date: new Date(),
    });

    await user.save();
    res.status(200).json({
      message: "Deposit Successfull",
       user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
