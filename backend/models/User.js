const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');


async function findUserByEmail(db, email) {
  return await db.collection('users').findOne({ email: email.toLowerCase() });
}

async function findUserById(db, userId) {
  return await db.collection('users').findOne({ _id: new ObjectId(userId) });
}

async function createUser(db, { email, password, name }) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const result = await db.collection('users').insertOne({
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    provider: 'local',
    createdAt: new Date()
  });

  return {
    _id: result.insertedId,
    email: email.toLowerCase(),
    name,
    provider: 'local',
    createdAt: new Date()
  };
}

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}



async function findUserByProvider(db, provider, providerId) {
  const query = {};
  query[`${provider}Id`] = providerId;
  return await db.collection('users').findOne(query);
}

async function upsertProviderUser(db, provider, profileData) {
  const { id, email, name, picture } = profileData;
  const providerIdField = `${provider}Id`;

  const userDoc = {
    [providerIdField]: id,
    email: email ? email.toLowerCase() : null,
    name: name,
    picture: picture,
    provider: provider,
    lastLogin: new Date()
  };

  const result = await db.collection('users').insertOne({
    ...userDoc,
    createdAt: new Date()
  });

  return {
    _id: result.insertedId,
    ...userDoc,
    createdAt: new Date()
  };
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  comparePassword,
  findUserByProvider,
  upsertProviderUser
};
