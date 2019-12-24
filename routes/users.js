var express = require('express');
var User = require('../schemas/user');
var Category = require('../schemas/category');
var Diary = require('../schemas/diary');
var router = express.Router();

router.post('/login', async (req, res, next) => {
    const userId = req.body.id;
    const bounds = req.body.bounds;
    try {
        const user = await User.findOne({ id: userId });
        if (user) {
            req.session.userId = userId;
            req.session.userOid = user._id;
            const categories = await Category.find({ user: user._id }, {_id: 0, name: 1, color: 1});
            const diaries = await Diary.find({
                user: user._id,
                placeLat: { $lte: bounds.neLat, $gte: bounds.swLat },
                placeLng: { $lte: bounds.neLng, $gte: bounds.swLng }
            }).sort({category: 1, createdAt: -1});
            res.status(200).json({category: categories, diary: diaries});
        } else {
            res.redirect(307, '/users');
        }
    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    const userId = req.body.id;
    const bounds = req.body.bounds;
    if ( req.session.userId !== userId ) {
        try {
            const findedUser = await User.findOne({ id: userId });
            if ( findedUser ) {
                req.session.userOid = findedUser._id;
            } else {
                let user = new User({
                    id: userId
                });
                user = await user.save();
                req.session.userOid = user._id;
            }
            req.session.userId = userId;
        } catch (err) {
            console.error(err);
            next(err);
        }
    }
    try {
        const categories = await Category.find({ user: req.session.userOid }, {_id: 0, name: 1, color: 1});
        const diaries = await Diary.find({
            user: req.session.userOid,
            placeLat: { $lte: bounds.neLat, $gte: bounds.swLat },
            placeLng: { $lte: bounds.neLng, $gte: bounds.swLng }
        }).sort({category: 1, createdAt: -1});
        res.status(201).json({category: categories, diary: diaries});
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;
