const express = require("express");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "ankur@123";
const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const axios = require("axios");


const router = express.Router();

router.get("/top_gainers_losers", async function (req, res) {
  try {
    console.log("Hello")
    const { page, per_page } = req.query;

    const response = await axios.post(
      `https://api.livecoinwatch.com/coins/list`,
      {
        currency: "INR",
        sort: "rank",
        order: "ascending",
        offset: Number(page - 1) * Number(per_page),
        limit: Number(per_page),
        meta: true,
      },
      {
        headers: {
          "x-api-key": process.env.COIN_API_KEY,
        },
      }
    );
    if (response.status === 200) {
      console.log("success");
      res.status(200).json({ status: "true", data: response.data });
    } else {
      res.status(500).json({ status: "false", coins: [] });
    }
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ status: "false", msg: "Server error", error: error.message });
  }
});

router.get("/search-coin", async function (req, res) {
  try {
    const { coin } = req.query;
    const response = await axios.post(
      `https://api.livecoinwatch.com/coins/single`,
      {
        currency: "INR",
        code: coin,
        meta: true,
      },
      {
        headers: {
          "x-api-key": process.env.COIN_API_KEY,
        },
      }
    );
    if (response.status === 200) {
      res.status(200).json({ status: "true", data: [response.data] });
    } else {
      res.status(500).json({ status: "false", coins: [] });
    }
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ status: "false", msg: "Server error", error: error.message });
  }
});

router.get("/get-assets", async function (req, res) {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "false", msg: "User not found" });
    }

    if (user.assets.length === 0) {
      return res
        .status(200)
        .json({ status: "true", msg: "No assets available", user });
    }
    res
      .status(200)
      .json({ status: "true", msg: "Assets fetched succesfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, msg: "Server error" });
  }
});

router.get("/get-wishlist/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(500).json({ status: "false", msg: "No user found" });
    }

    const formattedIds = user.wishlist.join(",");
    // const response = await axios.get(
    //   `https://api.coingecko.com/api/v3/coins/markets?ids=${formattedIds}&vs_currency=INR&order=market_cap_desc`,
    //   {
    //     headers: {
    //       accept: "application/json",
    //     },
    //   }
    // );

    const response = await axios.post(
      `https://api.livecoinwatch.com/coins/map`,
      {
        codes: user.wishlist,
        currency: "INR",
        sort: "rank",
        order: "ascending",
        // offset: page,
        // limit: per_page,
        meta: true,
      },
      {
        headers: {
          accept: "application/json",
          "x-api-key": process.env.COIN_API_KEY,
        },
      }
    );

    res.status(200).json({ status: "true", data: response.data });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ status: "false", msg: "Server error", error: error.message });
  }
});

router.post("/toggle-wishlist/:userId/:coinCode", async function (req, res) {
  try {
    // Find the user by ID
    const { userId, coinCode } = req.params;
    const { isLiked } = req.body;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ status: "false", msg: "User not found" });
    }

    if (isLiked) {
      // If not present, add it to the wishlist
      if (!user.wishlist.includes(coinCode)) {
        user.wishlist.push(coinCode);
      }
    } else {
      // If present, remove it from the wishlist
      user.wishlist.pull(coinCode);
    }
    // Save the updated user document
    await user.save();
    return res.status(200).json({
      status: "true",
      msg: isLiked ? "Coin added to wishlist" : "Coin removed from wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "false", msg: "Server error", error: error.message });
  }
});

router.put("/buy-coin", async (req, res) => {
  const { userId, pay, ...coin } = req.body;
  if (!userId || !coin || !pay) {
    console.log("All fileds are required");
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balanceAmount < pay) {
      return res
        .status(400)
        .json({ status: "true", msg: "Insufficient Balance" });
    }

    const asset = user.assets.find((a) => a.coin.code === coin.code);
    let quantity = pay / coin.rate;

    if (asset) {
      // If the user already owns the coin, update the quantity and add a transaction
      const totalCost =
        asset.quantity * asset.averageBuyPrice + quantity * coin.rate;
      const updatedQuantity = asset.quantity + quantity;

      const newAveragePrice = totalCost / updatedQuantity;

      asset.averageBuyPrice = newAveragePrice;
      asset.quantity = updatedQuantity;
    } else {
      user.assets.push({
        coin: {
          id: coin.code,
          image: coin.png64,
          name: coin.name,
          code: coin.code,
        },
        quantity: quantity,
        averageBuyPrice: Number(coin.rate),
      });
    }

    user.balanceAmount = Number(user.balanceAmount) - pay;

    user.transactions.push({
      type: "buy",
      price: Number(coin.rate),
      coin: {
        id: coin.code,
        image: coin.png64,
        name: coin.name,
        code: coin.code,
        quantity: quantity,
        amount: pay,
      },
      date: new Date(),
    });

    // Save the updated user document
    await user.save();
    res.status(200).json({
      message: "Coin purchase recorded successfully",
      assets: user.assets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/sell-coin", async (req, res) => {
  const { userId, pay, ...coin } = req.body;
  if (!userId || !coin || !pay) {
    console.log("All fields are required");
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const asset = user.assets.find((a) => a.coin.id === coin.id);

    if (!asset || asset.quantity * coin.rate < pay) {
      return res
        .status(400)
        .json({ status: "false", msg: "Insufficient Coin Quantity" });
    }

    const quantityToSell = pay / coin.rate;

    if (asset.quantity < quantityToSell) {
      return res
        .status(400)
        .json({ status: "false", msg: "Not enough quantity to sell" });
    }

    // Adjust the asset quantity
    asset.quantity -= quantityToSell;

    if (asset.quantity === 0) {
      // If the quantity is 0, remove the asset from the user's assets
      user.assets = user.assets.filter((a) => a.coin.id !== coin.id);
    }

    // Update user balance
    user.balanceAmount += Number(pay);

    // Record the transaction
    user.transactions.push({
      type: "sell",
      price: Number(coin.rate),
      coin: {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        quantity: quantityToSell,
        image: coin.image,
        amount: pay,
      },
      date: new Date(),
    });

    // Save the updated user document
    await user.save();
    res.status(200).json({
      message: "Coin sale recorded successfully",
      assets: user.assets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/history/:coinCode", async function (req, res) {
  try {
    const { coinCode } = req.params;
    const { timeFrame } = req.query;

    const today = new Date();
    let startDate;

    switch (timeFrame) {
      case '1D':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        break;
      case '1W':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        break;
      case '1M':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case '1Y':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      case '5Y':
        startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
        break;
      default:
        return res.status(400).json({ status: "false", msg: "Invalid timeFrame" });
    }

    const response = await axios.post(
      `https://api.livecoinwatch.com/coins/single/history`,
      {
        currency: "INR",
        code: coinCode,
        meta: true,
        start: startDate.getTime(),
        end: today.getTime(),
      },
      {
        headers: {
          "x-api-key": "add5c2ff-2364-4772-a9e3-429357fe72b0",
        },
      }
    );

    if (response.status === 200) {
      res.status(200).json({ status: "true", data: response.data });
    } else {
      res.status(500).json({ status: "false", coins: [] });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ status: "false", msg: "Server error", error: error.message });
  }
});



module.exports = router;
