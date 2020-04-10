var express = require('express');
var User = require('../schemas/user');
var Category = require('../schemas/category');
var Diary = require('../schemas/diary');
var router = express.Router();
const aw = require('../comm/util');

router.post('/login', aw(async (req, res, next) => {
    const userId = req.body.id;
    const bounds = req.body.bounds;
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
        res.status(200).json({category: categories, diary: diaries, homeBounds: user.homeBounds});
    } else {
        res.redirect(307, '/users');
    }
}));

router.post('/', aw(async (req, res, next) => {
    const userId = req.body.id;
    const bounds = req.body.bounds;
    if ( req.session.userId !== userId ) {
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
    }
    const categories = await Category.find({ user: req.session.userOid }, {_id: 0, name: 1, color: 1});
    const diaries = await Diary.find({
        user: req.session.userOid,
        placeLat: { $lte: bounds.neLat, $gte: bounds.swLat },
        placeLng: { $lte: bounds.neLng, $gte: bounds.swLng }
    }).sort({category: 1, createdAt: -1});
    const loginUser = await User.findOne({ _id: req.session.userOid });
    res.status(201).json({category: categories, diary: diaries, homeBounds: loginUser.homeBounds});
}));

router.put('/bnds', aw(async (req, res, next) => {
    const result = await User.updateOne({
        _id: req.session.userOid
    }, {
        $set: {
            homeBounds: req.body.homeBounds,
            lastChgedAt: Date.now()
        }});
    res.json(result);
}));

module.exports = router;
