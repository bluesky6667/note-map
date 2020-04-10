var express = require('express');
var Diary = require('../schemas/diary');
var router = express.Router();
const aw = require('../comm/util');

router.get('/', aw(async (req, res, next) => {
    const reqQuery = req.query;
    const searchParam = {};
    for (let key in reqQuery) {
        switch(key) {
            case 'keyword':
                searchParam.contents = { $regex: reqQuery[key] };
                break;
            case 'category':
                if (reqQuery[key].indexOf('카테고리 없음') > -1 || reqQuery[key].indexOf('none') > -1) {
                    searchParam['$or'] = [ {category: { $size: 0}}, {category: { $in: reqQuery[key] }} ];
                } else {
                    searchParam[key] = { $in: reqQuery[key] };
                }                
                break;
            case 'startDate':
                if (!searchParam.createdAt) {
                    searchParam.createdAt = {};    
                }
		const startDate = new Date(reqQuery[key]);
		searchParam.createdAt.$gte = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getTimezoneOffset()/60-9));
                break;
            case 'endDate':
                if (!searchParam.createdAt) {
                    searchParam.createdAt = {};    
                }
		const endDate = new Date(reqQuery[key]+' 23:59:59');
                searchParam.createdAt.$lte = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endDate.getHours()+endDate.getTimezoneOffset()/60-9, endDate.getMinutes(), endDate.getSeconds()));
                break;
            case 'diaryId':
                searchParam._id = reqQuery[key];
                break;
            default:
                searchParam[key] = reqQuery[key];
                break;
        }
    }
    searchParam.user = req.session.userOid;
    const diaryList = await Diary.find(searchParam,{user: 0}).sort({createdAt: -1});
    res.json(diaryList);
}));

router.post('/', aw(async (req, res, next) => {
    const diary = new Diary({
        user: req.session.userOid,
        category: req.body.category,
        contents: req.body.contents,
        place: req.body.place,
        placeLat: req.body.placeLat,
        placeLng: req.body.placeLng
    });
    const result = await diary.save();
    res.status(201).json(result);
}));

router.put('/', aw(async (req, res, next) => {
    const result = await Diary.update({
        user: req.session.userOid,
        _id: req.body.diaryId
    }, {
        $set: {
            category: (req.body.category ? req.body.category : []), 
            contents: req.body.contents,
            place: req.body.place,
            placeLat: req.body.placeLat,
            placeLng: req.body.placeLng,
            lastChgedAt: Date.now()
        }});
    res.json(result);
}));

router.delete('/', aw(async (req, res, next) => {
    const diaryId = req.body.diaryId;
    const result = await Diary.remove({_id: diaryId});
    res.json({message: 'success', result: result});
}));

router.get('/marker', aw(async (req, res, next) => {
    const bounds = req.query.bounds;
    const diaryList = await Diary.find({
        user: req.session.userOid,
        placeLat: { $lte: bounds.neLat, $gte: bounds.swLat },
        placeLng: { $lte: bounds.neLng, $gte: bounds.swLng }
    }, {user: 0}).sort({category: 1, createdAt: -1});
    res.json({diary: diaryList});
}));
module.exports = router;
