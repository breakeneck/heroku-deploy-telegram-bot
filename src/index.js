import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';

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

    bot.sendMessage(chatId, 'УкрЗалізниця pinger. Use /from command to add departure station');

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
                bot.sendMessage(msg.chat.id, 'Nothing found, try again please /from command');
                break;
            case 1:
                bot.sendMessage(msg.chat.id, 'Departure station is selected, please, search for arrival station using /to command');
                chats[chatId].from = response[0];
                break;
            default:
                bot.sendMessage(msg.chat.id, 'Selected departure station from list:', buttonOpts('from', response));
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
    uz.stationSearch(query).then(response => {
        switch (response.length) {
            case 0:
                bot.sendMessage(msg.chat.id, 'Nothing found, try again please /to command');
                break;
            case 1:
                bot.sendMessage(msg.chat.id, 'Arrival station is selected, please, add departure date using /at command');
                chats[chatId].to = response[0];
                break;
            default:
                bot.sendMessage(msg.chat.id, 'Selected arrival station from list:', buttonOpts('to', response));
        }
    });

});


bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    let action, stationId;
    let chatId = msg.chat.id;
    let msg = callbackQuery.message;
    [action, stationId] = callbackQuery.data.split('_');

    chats[chatId][action] = {
        title: msg.text,
        value: stationId
    };
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

    // SEARCH FOR RESULT & RUN SCHEDULER
    execUzPing(chatId);
    chats[chatId].interval = setInterval(() => execUzPing(chatId), scriptRepeatTime);
});


bot.onText(/\/status/, (msg, match) => {
    let chatId = msg.chat.id;

    if(validateCommand(msg))
        bot.sendMessage(msg.chat.id, chats[chatId].lastResponse);
});

bot.onText(/\/stop/, (msg, match) => {
    let chatId = msg.chat.id;

    if(!validateCommand(msg))
        return;

    // STOP PREVIOUSLY RUNNED SCRIPT
    if(chats.hasOwnProperty(chatId) && chats[chatId].interval) {
        clearInterval(chats[chatId].interval);
        bot.sendMessage(chatId, `Scheduler "${chats[chatId].from.title} - ${chats[chatId].to.title}" stopped`);
    }
    else
        bot.sendMessage(chatId, 'Scheduler is not in run state');
});



let validateCommand = (msg) => {
    if(!chats.hasOwnProperty(msg.chat.id))
        bot.sendMessage(msg.chat.id, 'To start script, please use /start command first');
    
    return chats.hasOwnProperty(msg.chat.id);
};


let execUzPing = (chatId) => {
    let chat = chats[chatId];
    ping(chat.from.value, chat.to.value, chat.at).then(
        result => bot.sendMessage(chatId, result),
        error => chat.lastResponse = error
    );
};

let buttonOpts = (action, uzStationsResponse) => {
    return {
        reply_markup: {
            inline_keyboard: [
                uzStationsResponse.map((station) => {
                    return {
                        text: station.title,
                        callback_data: action + '_' + station.value
                    }
                })
            ]
        }
    }
};