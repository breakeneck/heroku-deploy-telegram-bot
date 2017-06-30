/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 29.06.2017
 */

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


exports.get = (userId) =>
    _users[userId].schedulers[_users[userId].currentSchedulerName];

exports.debug = () =>
    console.log(_users);