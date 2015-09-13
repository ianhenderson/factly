var env = process.env.FACTLY || 'prod';

console.log('env', env);

var config = {
  test: {
    file: 'mock.db',
    debug: false
  },
  prod: {
    file: 'test.db',
    debug: false
  }
};

module.exports = config[env];