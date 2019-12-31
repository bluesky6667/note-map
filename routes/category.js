var express = require('express');
var Category = require('../schemas/category');
var Diary = require('../schemas/diary');
var router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const category = new Category({
            user: req.session.userOid,
            name: req.body.name,
            color: req.body.color
        });
        const result = category.save();
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.delete('/', async (req, res, next) => {
    const userOid = req.session.userOid;
    const categoryName = req.body.name;
    try {
        const result = await Category.remove({user: userOid, name: categoryName});
        await Diary.update({ user: userOid }, 
        { $pull: { category: categoryName } }, {multi: true});
        res.json({message: 'success', result: result});
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;
