const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types : { ObjectId } } = Schema;
const scheduleSchema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: 'User'
    },
    contents: {
        type: String
    },
    place: {
        type: String
    },
    placeLat: {
        type: Number
    },
    placeLng: {
        type: Number
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    }, 
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastChgedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Schedule', scheduleSchema);