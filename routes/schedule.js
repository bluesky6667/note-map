var express = require('express');
var Schedule = require('../schemas/schedule');
var router = express.Router();
const aw = require('../comm/util');

router.get('/', aw(async (req, res, next) => {
    const reqQuery = req.query;
    const calendarDate = new Date(reqQuery.date);
    const searchParam = {};
    if ( reqQuery.day ) {
        searchParam.startTime = {
            $gte: new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), -9, 0, 0)),
            $lt: new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate()+1, -9, 0, 0))
        };
    } else {
        searchParam.startTime = {
            $gte: new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), 1, -9)),
            $lt: new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1, -9))
        };
    }
    searchParam.user = req.session.userOid;
    const scheds = await Schedule.find(searchParam, {user: 0}).sort({startTime: 1, endTime: 1});
    res.json(scheds);
}));

router.get('/marker', aw(async (req, res, next) => {
    const bounds = req.query.bounds;
    const date = new Date(req.query.date);
    const schedList = await Schedule.find({
        user: req.session.userOid,
        endTime: { $gte: date },
        placeLat: { $lte: bounds.neLat, $gte: bounds.swLat },
        placeLng: { $lte: bounds.neLng, $gte: bounds.swLng }
    }, {user: 0});
    res.json({sched: schedList});
}));

router.get('/:id', aw(async (req, res, next) => {
    const searchParam = {
        user: req.session.userOid,
        _id: req.params.id
    };
    const sched = await Schedule.findOne(searchParam, {user: 0});
    res.json(sched);
}));

router.post('/', aw(async (req, res, next) => {
    const sched = new Schedule({
        user: req.session.userOid,
        contents: req.body.contents,
        place: req.body.place,
        placeLat: req.body.placeLat,
        placeLng: req.body.placeLng,
        startTime: req.body.startTime,
        endTime: req.body.endTime
    });
    const result = await sched.save();
    res.status(201).json(result);
}));

router.put('/', aw(async (req, res, next) => {
    const result = await Schedule.update({
        user: req.session.userOid,
        _id: req.body.schedId
    }, {
        $set: {
            contents: req.body.contents,
            place: req.body.place,
            placeLat: req.body.placeLat,
            placeLng: req.body.placeLng,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            lastChgedAt: Date.now()
        }});
    res.json(result);
}));

router.delete('/', aw(async (req, res, next) => {
    const schedId = req.body.schedId;
    const result = await Schedule.remove({_id: schedId});
    res.json({message: 'success', result: result});
}));

module.exports = router;
