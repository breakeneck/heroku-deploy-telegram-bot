/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 29.06.2017
 */


const fs = require('fs');

let _users = {}; // SEE addScheduler FOR OBJECT STRUCTURE

exports.add = (userId, schedulerName) => {
    // STOP PREVIOUSLY RUNNED SCRIPT
    if(_users[userId] && _users[userId].schedulers[schedulerName])
        clearInterval(_users[userId].schedulers[schedulerName].interval);

    // INIT _users OBJECT
    if(!_users[userId])
        _users[userId] = {
            schedulers: {},
            currentSchedulerName: ''
        };

    // INIT SCHEDULER OBJECT INSIDE _users
    _users[userId].schedulers[schedulerName] = {
        id: userId,
        interval: null,
        from: {},
        to: {},
        at: ''
    };
    _users[userId].currentSchedulerName = schedulerName;
};

exports.loadAll = () => {
    _users = JSON.parse(fs.readFileSync('./db/data.json'));
    for(let userId in _users)
        if(_users[userId].schedulers && _users[userId].schedulers.interval)
            _users[userId].schedulers.interval = null;
};

exports.saveAll = () => {
    fs.writeFile('./db/data.json', JSON.stringify(_users) , 'utf-8');
};

exports.count = () =>
    Object.keys(_users).length;

exports.delete = () =>
    Object.keys(_users).length;


exports.switch = (userId, schedulerName) => {
    if (_users[userId] && _users[userId].schedulers[schedulerName])
        return _users[userId].currentSchedulerName = schedulerName;
    else
        return false;
};


exports.list = (userId) =>
    Object.keys(_users[userId].schedulers);


exports.getByName = (userId, schedulerName) =>
    _users[userId].schedulers[schedulerName];


let get = (userId) =>
    _users[userId].schedulers[_users[userId].currentSchedulerName];
exports.get = get;

exports.debug = (chatId) => {
    if (chatId && _users[chatId])
        console.log(get(userId));
    else
        console.log(_users);
};

exports.trainTitle = (userId) =>
    // `${scheduler.get(userId).from.title} - ${scheduler.get(userId).to.title} at ${scheduler.get(userId).at}`
    `${get(userId).from.title} - ${get(userId).to.title} at ${get(userId).at}`;





/*

 /*
 let Datastore = require('nedb');
 let db = new Datastore({ filename: 'db/users.nedb' });
 db.loadDatabase(err => err ? console.error('DB LOAD ERROR '+err) : '');


 exports.save = (userId) => {
 let self = get(userId);


 if(db.find({id: userId}))
 db.insert({
 id: userId,
 interval: null,
 from: {},
 to: {},
 at: ''
 });
 };*/