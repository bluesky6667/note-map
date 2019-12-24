const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    lastLonginAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);