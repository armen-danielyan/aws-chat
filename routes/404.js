module.exports = (req, res, next) => {
    res.status(404);
    res.json({status: 'error', msg: '404 Not Found'});
};