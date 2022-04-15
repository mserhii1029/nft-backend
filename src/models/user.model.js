const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Web3 = require('web3');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/c78d97601e30450d8f86f75dc1fec7f2');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      validate(value) {
        if (!web3.utils.isAddress(value)) {
          throw new Error('Invalid address');
        }
      },
    },
    nonce: {
      type: Number,
      required: false,
      unique: false,
      default: () => Math.floor(Math.random() * 1000000), // Initialize with a random nonce
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
