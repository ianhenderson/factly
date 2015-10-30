var env = process.env.FACTLY || 'prod';

var config = {
  test: {
    file: 'mock.db',
    trace: false,
    profile: false,
    port: process.env.PORT || 3001
  },
  prod: {
    file: 'test.db',
    trace: false,
    profile: false,
    port: process.env.PORT || 3000
  }
};

module.exports = config[env];