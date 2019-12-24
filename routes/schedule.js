var express = require('express');
var Schedule = require('../schemas/schedule');
var router = express.Router();

router.get('/', async (req, res, next) => {
    const reqQuery = req.query;
    const calendarDate = new Date(reqQuery.date);
    const searchParam = {};
    if ( reqQuery.day ) {
        searchParam.startTime = {
            $gte: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate(), 0, 0, 0),
            $lt: new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, calendarDate.getDate()+1, 0, 0, 0)
        };
    } else {
        searchParam.startTime = {
            $gte: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1),
            $lt: new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1)
        };
    }
    searchParam.user = req.session.userOid;
    try {
        const scheds = await Schedule.find(searchParam, {user: 0}).sort({startTime: 1, endTime: 1});
        res.json(scheds);
    } catch (err) {
        console.error(err);
        next(err);
    }
    
});

router.get('/marker', async (req, res, next) => {
    const bounds = req.query.bounds;
    const date = new Date(req.query.date);
    try {
        const schedList = await Schedule.find({
            user: req.session.userOid,
            startTime: { $gte: date },
            placeLat: { $lte: bounds.neLat, $gte: bounds.swLat },
            placeLng: { $lte: bounds.neLng, $gte: bounds.swLng }
        }, {user: 0});
        res.json({sched: schedList});
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    const searchParam = {
        user: req.session.userOid,
        _id: req.params.id
    };
    try {
        const sched = await Schedule.findOne(searchParam, {user: 0});
        res.json(sched);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const diary = new Schedule({
            user: req.session.userOid,
            contents: req.body.contents,
            place: req.body.place,
            placeLat: req.body.placeLat,
            placeLng: req.body.placeLng,
            startTime: req.body.startTime,
            endTime: req.body.endTime
        });
        const result = await diary.save();
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.put('/', async (req, res, next) => {
    try {
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
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.delete('/', async (req, res, next) => {
    const diaryId = req.body.diaryId;
    try {
        const result = await Schedule.remove({_id: diaryId});
        res.json({message: 'success', result: result});
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;
