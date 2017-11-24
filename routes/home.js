module.exports = (req, res, next) => {
    let conversation = {
        from: req.query.from ? req.query.from : '',
        to: req.query.to ? req.query.to : ''
    };

    res.render('home', {title: 'Home', conversation: conversation});
};