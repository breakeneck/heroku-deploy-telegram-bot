import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';
import helper from './helper';
import scheduler from './scheduler';
const fs = require('fs');

const scriptRepeatTime = 0.25*60*1000;


console.log('App started');

let bot;
const token = JSON.parse(fs.readFileSync('./config/data.json')).telegram_token;
bot = new TelegramBot(token, {polling: true});
// bot = new TelegramBot(token, { webHook: { port } });
// bot.setWebHook(url);

if(fs.existsSync('./db/data.json'))
    scheduler.loadAll();

console.log('Bot Started, Waiting for "/start {schedulerName}" command');


// BOT COMMANDS
bot.onText(/\/restore/, (msg, match) => {
    scheduler.loadAll();

    bot.sendMessage(userId, scheduler.count);
});

// RUNNING BOT
bot.onText(/\/start (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let schedulerName = match[1];

    scheduler.add(userId, schedulerName);

    bot.sendMessage(userId, 'УкрЗалізниця pinger. Use /from command to add departure station', helper.hideKeyboardOpts());
});


// RUNNING BOT
bot.onText(/\/schedulers/, (msg, match) => {
    scheduler.debug();

    let userId = msg.from.id;

    if(!validateCommand(msg))
        return;

    bot.sendMessage(msg.chat.id, 'Please select scheduler', {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            keyboard: scheduler.list(userId).map(
                name =>
                    ['/switch '+name]
            )
        })
    });
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
                bot.sendMessage(msg.from.id, 'Selected departure station from list:', helper.buttonOpts(userId, 'from', response));
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
                bot.sendMessage(userId, 'Selected arrival station from list:', helper.buttonOpts(userId, 'to', response));
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

    // SAVE SCHEDULERS TO FILE
    scheduler.saveAll();

    runScheduler(userId);
});


bot.onText(/\/status/, (msg, match) => {
    scheduler.debug(userId);

    let userId = msg.from.id;
    let currentScheduler = scheduler.get(userId);

    if(validateCommand(msg))
        sendStatus(userId, currentScheduler);
});

bot.onText(/\/status (.+)/, (msg, match) => {
    scheduler.debug();

    let userId = msg.from.id;
    let schedulerName = match[1];
    let selectedScheduler = scheduler.getByName(userId, schedulerName);

    if(validateCommand(msg))
        sendStatus(userId, selectedScheduler);
});

bot.onText(/\/switch (.+)/, (msg, match) => {
    let userId = msg.from.id;
    let schedulerName = match[1];

    if(validateCommand(msg)){
        if(scheduler.switch(userId, schedulerName))
            bot.sendMessage(userId, `Active Scheduler is switched to "${schedulerName}". You can check its /status`, helper.hideKeyboardOpts());
        else
            bot.sendMessage(userId, `Scheduler "${schedulerName}" not exists`, helper.hideKeyboardOpts());
    }
});

bot.onText(/\/stop/, (msg, match) => {
    let userId = msg.from.id;

    if(!validateCommand(msg))
        return;

    // STOP PREVIOUSLY RUNNED SCRIPT
    if(scheduler.get(userId) && scheduler.get(userId).interval) {
        clearInterval(scheduler.get(userId).interval);
        scheduler.get(userId).interval = null;
        bot.sendMessage(userId, `Scheduler "${scheduler.get(userId).from.title} - ${scheduler.get(userId).to.title}" stopped`, helper.hideKeyboardOpts());
    }
    else
        bot.sendMessage(userId, 'Scheduler is not in run state', helper.hideKeyboardOpts());
});

bot.onText(/\/run/, (msg, match) => {
    let userId = msg.from.id;

    if(!validateCommand(msg))
        return;

    // RUN SCRIPT
    if(scheduler.get(userId) && !scheduler.get(userId).interval)
        runScheduler(userId);
    else
        bot.sendMessage(userId, 'Scheduler was already in run state');
});



bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    scheduler.debug();

    let [userId, action, stationId, stationTitle] = callbackQuery.data.split('_');

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

let execUzTrainSearch = (userId, returnResultImmediately) => {
    uz.searchTrain(scheduler.get(userId).from.value, scheduler.get(userId).to.value, scheduler.get(userId).at).then(
        result => {
            scheduler.get(userId).lastResponse = result;
            bot.sendMessage(userId, result);

            console.log(`Searching for train ${scheduler.trainTitle(userId)}: ${result}`);
        },
        error => {
            scheduler.get(userId).lastResponse = error;

            if(returnResultImmediately)
                bot.sendMessage(userId, result);

            console.log(`Searching for train ${scheduler.trainTitle(userId)}: ${error}`);
        }
    );
};

let sendStatus = (userId, currentScheduler) => {
    let response = [];
    if(currentScheduler.from.title)
        response.push(`From: ${currentScheduler.from.title}`);
    if(currentScheduler.to && currentScheduler.to.title)
        response.push(`To: ${currentScheduler.to.title}`);
    if(currentScheduler.at)
        response.push(`At: ${currentScheduler.at}`);
    response.push('Scheduler '+(currentScheduler.interval ? 'enabled' : 'not set'));
    response.push(`Last Response ${currentScheduler.lastResponse}`);

    bot.sendMessage(userId, response.join("\n"), helper.hideKeyboardOpts());
};

let runAll = (userId) => {

};

let runScheduler = (userId) => {
    scheduler.get(userId).lastResponse = '';

    console.log('Data is ready for scheduler', scheduler.get(userId));

    bot.sendMessage(userId, 'Departure time is set, script will check each '
        + Math.round(scriptRepeatTime/60000) + ' minutes'
        + '. Check /schedulers command to view all schedulers',
        helper.hideKeyboardOpts()
    );
    // SEARCH FOR RESULT & RUN SCHEDULER
    execUzTrainSearch(userId, true);
    scheduler.get(userId).interval = setInterval(() => execUzTrainSearch(userId), scriptRepeatTime);
};