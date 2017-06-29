import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';
import helper from './helper';

const token = process.env.TOKEN;
const port = process.env.PORT;
const mode = process.env.NODE_ENV;
const url = `https://${process.env.HEROKU_NAME}.herokuapp.com/bot${token}`;

const scriptRepeatTime = 5*60*1000;

let _users = {}; // SEE addScheduler FOR OBJECT STRUCTURE
let scheduler = (userId) => _users[userId].schedulers[_users[userId].currentSchedulerName];

let addScheduler = (userId, schedulerName) => {
    // STOP PREVIOUSLY RUNNED SCRIPT
    if(_users[userId] && _users[userId].schedulers[schedulerName])
        clearInterval(_users[userId].schedulers[schedulerName].interval);

    // INIT SCHEDULER
    _users[userId]['schedulers'][schedulerName] = {
        id: userId,
        interval: null,
        from: null,
        to: null,
        at: ''
    };
    _users[userId].currentSchedulerName = schedulerName;
};
let listSchedulers = (userId) => Object.keys(_users[userId].schedulers);
let schedulerByName = (userId, schedulerName) => _users[userId].schedulers[schedulerName];

console.log('Bot Started, Waiting for "/start {schedulerName}" command');


let bot;
bot = new TelegramBot(token, { webHook: { port } });
bot.setWebHook(url);
// RUNNING BOT
bot.onText(/\/start (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let schedulerName = match[0];

    addScheduler(userId, schedulerName);

    bot.sendMessage(userId, 'УкрЗалізниця pinger. Use /from command to add departure station', helper.hideKeyboardOpts());
});


// RUNNING BOT
bot.onText(/\/schedulers/, (msg, match) => {
    let userId = msg.from.id;

    bot.sendMessage(userId, listSchedulers());
});




bot.onText(/\/from (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let query = match[1];

    if(!validateCommand(msg))
        return;

    uz.searchStation(query).then(response => {
        switch (response.length) {
            case 0:
                bot.sendMessage(msg.from.id, 'Nothing found, try again please /from command', helper.hideKeyboardOpts());
                break;
            case 1:
                bot.sendMessage(msg.from.id, 'Departure station is selected, please, search for arrival station using /to command', helper.hideKeyboardOpts());
                scheduler(userId).from = response[0];
                break;
            default:
                bot.sendMessage(msg.from.id, 'Selected departure station from list:', helper.buttonOpts('from', response));
        }
    });
});


bot.onText(/\/to (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let query = match[1];

    // VALIDATION
    if(!validateCommand(msg))
        return;
    if(!scheduler(userId).from)
        bot.sendMessage(userId, 'Please, set up from station first using /from command');

    //
    uz.searchStation(query).then(response => {
        switch (response.length) {
            case 0:
                bot.sendMessage(msg.from.id, 'Nothing found, try again please /to command');
                break;
            case 1:
                bot.sendMessage(msg.from.id, 'Arrival station is selected, please, add departure date using /at command');
                scheduler(userId).to = response[0];
                break;
            default:
                bot.sendMessage(msg.from.id, 'Selected arrival station from list:', helper.buttonOpts('to', response));
        }
    });

});


bot.onText(/\/at (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let at = match[1];

    // VALIDATION
    if(!validateCommand(msg))
        return;
    if(!scheduler(userId).from)
        bot.sendMessage(userId, 'Please, set up departure station first using /from command');
    if(!scheduler(userId).to)
        bot.sendMessage(userId, 'Please, set up arrival station first using /to command');

    // FILL IN LAST PARAMETERS
    scheduler(userId).at = at;
    scheduler(userId).lastResponse = '';

    console.log('Data is ready for scheduler', scheduler(userId));

    bot.sendMessage(userId, 'Departure time is set, script will check each '
        + Math.round(scriptRepeatTime/60000) + ' minutes', helper.hideKeyboardOpts()
        + '. Check /schedulers command to view all schedulers'
    );
    // SEARCH FOR RESULT & RUN SCHEDULER
    execUzTrainSearch(userId);
    scheduler(userId).interval = setInterval(() => execUzTrainSearch(userId), scriptRepeatTime);
});


bot.onText(/\/status/, (msg, match) => {
    let userId = msg.from.id;
    let chat = scheduler(userId);
    console.log(chat);

    if(validateCommand(msg)) {
        let response = [];
        if(chat.from.title)
            response.push(`From: ${chat.from.title}`);
        if(chat.to.title)
            response.push(`To: ${chat.to.title}`);
        if(chat.at)
            response.push(`At: ${chat.at}`);
        response.push('Scheduler '+(chat.interval ? 'enabled' : 'not set'));
        response.push(`Last Response ${chat.lastResponse}`);

        bot.sendMessage(msg.from.id, response.join("\n"), helper.hideKeyboardOpts());
    }
});

bot.onText(/\/status (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let schedulerName = match[0];
    let chat = schedulerByName(userId, schedulerName);
    console.log(chat);

    if(validateCommand(msg)) {
        let response = [];
        if(chat.from.title)
            response.push(`From: ${chat.from.title}`);
        if(chat.to.title)
            response.push(`To: ${chat.to.title}`);
        if(chat.at)
            response.push(`At: ${chat.at}`);
        response.push('Scheduler '+(chat.interval ? 'enabled' : 'not set'));
        response.push(`Last Response ${chat.lastResponse}`);

        bot.sendMessage(msg.from.id, response.join("\n"), helper.hideKeyboardOpts());
    }
});

bot.onText(/\/stop/, (msg, match) => {
    let userId = msg.from.id;

    if(!validateCommand(msg))
        return;

    // STOP PREVIOUSLY RUNNED SCRIPT
    if(scheduler(userId) && scheduler(userId).interval) {
        clearInterval(scheduler(userId).interval);
        bot.sendMessage(userId, `Scheduler "${scheduler(userId).from.title} - ${scheduler(userId).to.title}" stopped`, helper.hideKeyboardOpts());
    }
    else
        bot.sendMessage(userId, 'Scheduler is not in run state', helper.hideKeyboardOpts());
});



bot.on('callback_query', function onCallbackQuery(callbackQuery) {

    let [action, stationId, stationTitle] = callbackQuery.data.split('_');
    let msg = callbackQuery.message;
    let userId = msg.from.id;

    scheduler(userId)[action] = {
        title: stationTitle,
        value: stationId
    };

    switch(action) {
        case 'from':
            bot.sendMessage(userId, 'Departure station is selected, please, search for arrival station using /to command');
            break;
        case 'to':
            bot.sendMessage(userId, 'Arrival station is selected, please, add departure date using /at command');
            break;
    }
});

let validateCommand = (msg) => {
    let userId = msg.from.id;
    if(!scheduler(userId))
        bot.sendMessage(msg.from.id, 'To start script, please use "/start {schedulerName}" command first');

    return scheduler(userId);
};

let execUzTrainSearch = (userId) => {
    uz.searchTrain(chat.from.value, chat.to.value, chat.at).then(
        result => {
            scheduler(userId).lastResponse = result;
            bot.sendMessage(userId, result)
        },
        error => scheduler(userId).lastResponse = error
    );
};