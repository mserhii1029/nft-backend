const mongoose = require('mongoose');
const Web3 = require('web3');

const { toJSON, paginate } = require('./plugins');

const web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/c78d97601e30450d8f86f75dc1fec7f2');

const accountSchema = mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
accountSchema.plugin(toJSON);
accountSchema.plugin(paginate);

/**
 * Check if address is taken
 * @param {string} address - The user's address
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
accountSchema.statics.isAddressTaken = async function (address, excludeUserId) {
  const user = await this.findOne({ address, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if address is taken
 * @param {string} address - The user's address
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
accountSchema.statics.isAddressValid = function (address) {
  const valid = web3.utils.isAddress(address);
  return !valid;
};

/**
 * @typedef Account
 */
const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
