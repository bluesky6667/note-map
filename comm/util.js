const logger = require('../logger');

const aw = asyncFn => {
    return (async (req, res, next) => {
        try {
            return await asyncFn(req, res, next);
        } catch (err) {
            logger.error(err.message);
            return next(err);
        }
    });
}

const temp = 0;
module.exports = aw;