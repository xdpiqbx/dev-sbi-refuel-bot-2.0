const config = require('../config');

const mongoose = require('mongoose');

mongoose
  .connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Mongo Atlas connected ...');
  })
  .catch(e => console.log(e));

module.exports = mongoose;
