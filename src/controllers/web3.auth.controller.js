/* eslint-disable no-console */
const httpStatus = require('http-status');
const { recoverPersonalSignature } = require('eth-sig-util');
const catchAsync = require('../utils/catchAsync');
const {authService, userService, tokenService, emailService, accountService, accountTokenService, web3AuthService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { address } = req.body;
  const user = await web3AuthService.loginWithWeb3(address);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const authenticate = catchAsync(async (req, res) => {
  const { address, message, username } = req.body;
  console.log(address);
  console.log(message);
  console.log(username);
  const account = await accountService.getAccountByAddress(address);
  console.log(account);
  if (account === null || account === undefined) {
    const newUser = await accountService.createAccount(req.body);
    const tokens = await accountTokenService.generateAuthTokens(newUser);
    res.send({ newUser, tokens });
  } else {
    const tokens = await accountTokenService.generateAuthTokens(account);
    res.send({ account, tokens });
  }
});

const verifySignature = catchAsync(async (req, res) => {
  const { address, signature } = req.body;
  console.log(address);
  console.log(signature);

  const account = await accountService.getAccountByAddress(address);
  console.log(account);
  if (account === null || account === undefined) {
    res.status(httpStatus[404]).send('account not found');
  } else {
    const nonce = 811855;
    const message = `
    Welcome to Gulf NFT Marketplace!

    Click to sign in and accept the Gulf Terms of Service: https://gulfnft.com/terms-and-condition
    
    This request will not trigger a blockchain transaction or cost any gas fees.
    
    Your authentication status will reset after 24 hours.
    
    Wallet address: ${address}
    
    Nonce: ${nonce}`;

    const _address = recoverPersonalSignature({
      data: message,
      sig: signature,
    });
    if (_address.toLowerCase() === address.toLowerCase()) {
      account.nonce = Math.floor(Math.random() * 10000);
      const _account_ = await account.save();
      const tokens = await accountTokenService.generateAuthTokens(_account_);
      res.send({ tokens, account: _account_ });
    } else {
      res.status(401).send({ error: 'Signature verification failed!' });
    }
  }
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  authenticate,
  verifySignature,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
