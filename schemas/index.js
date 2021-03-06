const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, MONGO_HOST, NODE_ENV, DB_NAME } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@${MONGO_HOST}:27017/admin`;

module.exports = () => {
    const connect = () => {
        if (NODE_ENV !== 'production') {
            mongoose.set('debug', true);
        }
        mongoose.connect(MONGO_URL, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (error) => {
            if (error) {
                console.log('몽고디비 연결 에러', error);
            } else {
                console.log('몽고디비 연결 성공');
            }
        });
    };
    connect();
    mongoose.connection.on('error', (error) => {
        console.error('몽고디비 연결 에러', error);
    });
    mongoose.connection.on('disconnected', () => {
        console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
        connect();
    });
    require('./user');
    require('./diary');
    require('./category');
    require('./schedule');
};
