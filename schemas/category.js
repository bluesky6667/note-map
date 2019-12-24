const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types : { ObjectId } } = Schema;
const categorySchema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    color: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Category', categorySchema);