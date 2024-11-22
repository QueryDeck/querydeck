'use strict';
module.exports = function(router){

  router.all('*', (req, res, next) => {
    res.status(404).send({ error: 'Not found' });
  });
};
