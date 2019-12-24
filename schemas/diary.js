const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types : { ObjectId } } = Schema;
const diarySchema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: 'User'
    },
    category: {
        type: Array,
        default: []
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastChgedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Diary', diarySchema);