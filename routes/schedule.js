var express = require('express');
var Schedule = require('../schemas/schedule');
var router = express.Router();
const logger = require('../logger');

router.get('/', async (req, res, next) => {
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
            $gte: new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), 1)),
            $lt: new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))
        };
    }
    searchParam.user = req.session.userOid;
    try {
        const scheds = await Schedule.find(searchParam, {user: 0}).sort({startTime: 1, endTime: 1});
        res.json(scheds);
    } catch (err) {
	logger.error(err.message);
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
	logger.error(err.message);
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
        logger.error(err.message);
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
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
    } catch (err) {
        logger.error(err.message);
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
        logger.error(err.message);
        next(err);
    }
});

router.delete('/', async (req, res, next) => {
    const schedId = req.body.schedId;
    try {
        const result = await Schedule.remove({_id: schedId});
        res.json({message: 'success', result: result});
    } catch (err) {
        logger.error(err.message);
        next(err);
    }
});

module.exports = router;
