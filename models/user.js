const mongoose = require('mongoose');

// Define the transaction schema
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'buy', 'sell', 'convert', 'transfer'],
    required: true,
  },
  amount: {
    type: Number,
  },
  balance: {
    type: Number,
  },
  coin: {
    id: {
      type: String,
      required: function () {
        return this.type === 'buy' || this.type === 'sell';
      },
    },
    name: {
      type: String,
      required: function () {
        return this.type === 'buy' || this.type === 'sell';
      },
    },
    code: {
      type: String,
      required: function () {
        return this.type === 'buy' || this.type === 'sell';
      },
    },
    image: {
      type: String,
      required: function () {
        return this.type === 'buy' || this.type === 'sell';
      },
    },
    quantity: {
      type: Number,
      required: function () {
        return this.type === 'buy' || this.type === 'sell';
      },
    },
    amount: {
      type: Number,
      required: function () {
        return this.type === 'buy' || this.type === 'sell';
      },
    },
  },
  price: {
    type: Number,
    required: function () {
      return this.type === 'buy' || this.type === 'sell';
    },
  },
  sourceCoin: {
    type: String,
    required: function () {
      return this.type === 'convert';
    },
  },
  targetCoin: {
    type: String,
    required: function () {
      return this.type === 'convert';
    },
  },
  sourceAmount: {
    type: Number,
    required: function () {
      return this.type === 'convert';
    },
  },
  targetAmount: {
    type: Number,
    required: function () {
      return this.type === 'convert';
    },
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.type === 'transfer';
    },
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Define the asset schema
const assetSchema = new mongoose.Schema({
  coin: {
    image: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  averageBuyPrice: {
    type: Number,
    required: true,
    default: 0,
  },
});

// Define the user schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  wishlist: [{
    type: String,
    ref: 'Coin',
  }],
  assets: [assetSchema],
  balanceAmount: {
    type: Number,
    default: 500, // Store only the numeric balance here
  },
  transactions: [transactionSchema], // Store transaction history separately
});

const User = mongoose.model('User', userSchema);

module.exports = User;
