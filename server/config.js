var env = process.env.FACTLY || 'prod';

var config = {
  test: {
    file: 'mock.db',
    debug: false,
    port: process.env.PORT || 3000
  },
  prod: {
    file: 'test.db',
    debug: false,
    port: process.env.PORT || 3000
  }
};

module.exports = config[env];