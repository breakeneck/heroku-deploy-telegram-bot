import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';
import helper from './helper';
import scheduler from './scheduler';

const token = process.env.TOKEN;
const port = process.env.PORT;
const mode = process.env.NODE_ENV;
const url = `https://${process.env.HEROKU_NAME}.herokuapp.com/bot${token}`;

const scriptRepeatTime = 5*60*1000;

console.log('Bot Started, Waiting for "/start {schedulerName}" command');


let bot;
bot = new TelegramBot(token, { webHook: { port } });
bot.setWebHook(url);
// RUNNING BOT
bot.onText(/\/start (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let schedulerName = match[0];

    scheduler.add(userId, schedulerName);

    bot.sendMessage(userId, 'УкрЗалізниця pinger. Use /from command to add departure station', helper.hideKeyboardOpts());
});


// RUNNING BOT
bot.onText(/\/schedulers/, (msg, match) => {
    let userId = msg.from.id;

    bot.sendMessage(userId, scheduler.list(userId));
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
                scheduler.get(userId).from = response[0];
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
    if(!scheduler.get(userId).from)
        bot.sendMessage(userId, 'Please, set up from station first using /from command');

    //
    uz.searchStation(query).then(response => {
        switch (response.length) {
            case 0:
                bot.sendMessage(msg.from.id, 'Nothing found, try again please /to command');
                break;
            case 1:
                bot.sendMessage(msg.from.id, 'Arrival station is selected, please, add departure date using /at command');
                scheduler.get(userId).to = response[0];
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
    if(!scheduler.get(userId).from)
        bot.sendMessage(userId, 'Please, set up departure station first using /from command');
    if(!scheduler.get(userId).to)
        bot.sendMessage(userId, 'Please, set up arrival station first using /to command');

    // FILL IN LAST PARAMETERS
    scheduler.get(userId).at = at;
    scheduler.get(userId).lastResponse = '';

    console.log('Data is ready for scheduler', scheduler.get(userId));

    bot.sendMessage(userId, 'Departure time is set, script will check each '
        + Math.round(scriptRepeatTime/60000) + ' minutes', helper.hideKeyboardOpts()
        + '. Check /schedulers command to view all schedulers'
    );
    // SEARCH FOR RESULT & RUN SCHEDULER
    execUzTrainSearch(userId);
    scheduler.get(userId).interval = setInterval(() => execUzTrainSearch(userId), scriptRepeatTime);
});


bot.onText(/\/status/, (msg, match) => {
    scheduler.debug();

    let userId = msg.from.id;
    let current = scheduler.get(userId);

    if(validateCommand(msg)) {
        let response = [];
        if(current.from.title)
            response.push(`From: ${current.from.title}`);
        if(current.to && current.to.title)
            response.push(`To: ${current.to.title}`);
        if(current.at)
            response.push(`At: ${current.at}`);
        response.push('Scheduler '+(current.interval ? 'enabled' : 'not set'));
        response.push(`Last Response ${current.lastResponse}`);

        bot.sendMessage(msg.from.id, response.join("\n"), helper.hideKeyboardOpts());
    }
});

bot.onText(/\/status (.+)/, (msg, match) => {
    scheduler.debug();

    let userId = msg.from.id;
    let schedulerName = match[0];
    let chat = scheduler.getByName(userId, schedulerName);

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
    if(scheduler.get(userId) && scheduler.get(userId).interval) {
        clearInterval(scheduler.get(userId).interval);
        bot.sendMessage(userId, `Scheduler "${scheduler.get(userId).from.title} - ${scheduler.get(userId).to.title}" stopped`, helper.hideKeyboardOpts());
    }
    else
        bot.sendMessage(userId, 'Scheduler is not in run state', helper.hideKeyboardOpts());
});



bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    scheduler.debug();

    let [action, stationId, stationTitle] = callbackQuery.data.split('_');
    let msg = callbackQuery.message;
    let userId = msg.from.id;

    scheduler.get(userId)[action] = {
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
    if(!scheduler.get(userId))
        bot.sendMessage(msg.from.id, 'To start script, please use "/start {schedulerName}" command first');

    return scheduler.get(userId);
};

let execUzTrainSearch = (userId) => {
    uz.searchTrain(chat.from.value, chat.to.value, chat.at).then(
        result => {
            scheduler.get(userId).lastResponse = result;
            bot.sendMessage(userId, result)
        },
        error => scheduler.get(userId).lastResponse = error
    );
};