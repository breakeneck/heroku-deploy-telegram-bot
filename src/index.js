import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';
import helper from './helper';

const token = process.env.TOKEN;
const port = process.env.PORT;
const mode = process.env.NODE_ENV;
const url = `https://${process.env.HEROKU_NAME}.herokuapp.com/bot${token}`;

let bot;
bot = new TelegramBot(token, { webHook: { port } });
bot.setWebHook(url);

let chats = {};
//let interval = null;
let scriptRepeatTime = 5*60*1000;
let lastResponse = [];

console.log('Bot Started, Waiting for /start command');

// RUNNING BOT
bot.onText(/\/start/, (msg, match) => {
    let chatId = msg.chat.id;

    bot.sendMessage(chatId, 'УкрЗалізниця pinger. Use /from command to add departure station', helper.hideKeyboardOpts());

    // STOP PREVIOUSLY RUNNED SCRIPT
    if(chats.hasOwnProperty(chatId) && chats[chatId].interval)
        clearInterval(chats[chatId].interval);
    
    chats[chatId] = {
        id: chatId,
        interval: null,
        lastResponse: '',
        from: chats[chatId] ? chats[chatId].from : {},
        to: chats[chatId] ? chats[chatId].to : {},
        at: chats[chatId] ? chats[chatId].at : '',
    };
});




bot.onText(/\/from (.+)/, (msg, match) => {
    let chatId = msg.chat.id;
    let query = match[1];

    if(!validateCommand(msg))
        return;

    uz.searchStation(query).then(response => {
        switch (response.length) {
            case 0:
                bot.sendMessage(msg.chat.id, 'Nothing found, try again please /from command', helper.hideKeyboardOpts());
                break;
            case 1:
                bot.sendMessage(msg.chat.id, 'Departure station is selected, please, search for arrival station using /to command', helper.hideKeyboardOpts());
                chats[chatId].from = response[0];
                break;
            default:
                bot.sendMessage(msg.chat.id, 'Selected departure station from list:', helper.buttonOpts('from', response));
        }
    });
});


bot.onText(/\/to (.+)/, (msg, match) => {
    let chatId = msg.chat.id;
    let query = match[1];

    // VALIDATION
    if(!validateCommand(msg))
        return;
    if(!chats[chatId].from)
        bot.sendMessage(chatId, 'Please, set up from station first using /from command');

    //
    uz.searchStation(query).then(response => {
        switch (response.length) {
            case 0:
                bot.sendMessage(msg.chat.id, 'Nothing found, try again please /to command');
                break;
            case 1:
                bot.sendMessage(msg.chat.id, 'Arrival station is selected, please, add departure date using /at command');
                chats[chatId].to = response[0];
                break;
            default:
                bot.sendMessage(msg.chat.id, 'Selected arrival station from list:', helper.buttonOpts('to', response));
        }
    });

});


bot.onText(/\/at (.+)/, (msg, match) => {
    let chatId = msg.chat.id;
    let at = match[1];

    // VALIDATION
    if(!validateCommand(msg))
        return;
    if(!chats[chatId].from)
        bot.sendMessage(chatId, 'Please, set up departure station first using /from command');
    if(!chats[chatId].to)
        bot.sendMessage(chatId, 'Please, set up arrival station first using /to command');

    // FILL IN LAST PARAMETERS
    chats[chatId].at = at;
    chats[chatId].lastResponse = '';

    console.log('Data is ready for scheduler', chats[chatId]);

    bot.sendMessage(chatId, 'Departure time is set, script will check each ' + Math.round(scriptRepeatTime/60000) + ' minutes', helper.hideKeyboardOpts());
    // SEARCH FOR RESULT & RUN SCHEDULER
    execUzTrainSearch(chatId);
    chats[chatId].interval = setInterval(() => execUzTrainSearch(chatId), scriptRepeatTime);
});


bot.onText(/\/status/, (msg, match) => {
    let chatId = msg.chat.id;
    let chat = chats[chatId];
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

        bot.sendMessage(msg.chat.id, response.join("\n"), helper.hideKeyboardOpts());
    }
});

bot.onText(/\/stop/, (msg, match) => {
    let chatId = msg.chat.id;

    if(!validateCommand(msg))
        return;

    // STOP PREVIOUSLY RUNNED SCRIPT
    if(chats.hasOwnProperty(chatId) && chats[chatId].interval) {
        clearInterval(chats[chatId].interval);
        bot.sendMessage(chatId, `Scheduler "${chats[chatId].from.title} - ${chats[chatId].to.title}" stopped`, helper.hideKeyboardOpts());
    }
    else
        bot.sendMessage(chatId, 'Scheduler is not in run state', helper.hideKeyboardOpts());
});



bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery CHATS BEFORE', chats);

    let [action, stationId, stationTitle] = callbackQuery.data.split('_');
    let msg = callbackQuery.message;
    let chatId = msg.chat.id;

    chats[chatId][action] = {
        title: stationTitle,
        value: stationId
    };

    console.log('callbackQuery CHATS AFTER', chats);

    switch(action) {
        case 'from':
            bot.sendMessage(chatId, 'Departure station is selected, please, search for arrival station using /to command');
            break;
        case 'to':
            bot.sendMessage(chatId, 'Arrival station is selected, please, add departure date using /at command');
            break;
    }
});

let validateCommand = (msg) => {
    if(!chats.hasOwnProperty(msg.chat.id))
        bot.sendMessage(msg.chat.id, 'To start script, please use /start command first');

    return chats.hasOwnProperty(msg.chat.id);
};

let execUzTrainSearch = (chatId) => {
    let chat = chats[chatId];
    uz.searchTrain(chat.from.value, chat.to.value, chat.at).then(
        result => {
            chat.lastResponse = result;
            bot.sendMessage(chatId, result)
        },
        error => chat.lastResponse = error
    );
};