'use strict';

module.exports = function (router) {

  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });

}
