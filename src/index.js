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
let scriptRepeatTime = 0.1*60*1000;
let lastResponse = [];

console.log('Bot Started, Waiting for /start command');

// RUNNING BOT
bot.onText(/\/start (.+)/, (msg, match) => {
    let chatId = msg.chat.id;

    bot.sendMessage(chatId, 'УкрЗалізниця pinger. Use /from command to add departure station');

    // STOP PREVIOUSLY RUNNED SCRIPT
    if(chats.hasOwnProperty(chatId))
        clearInterval(chats[chatId].interval);
    
    chats[chatId] = {
        id: chatId,
        interval: null,
        lastResponse: '',
        from: '',
        to: '',
    };
});




bot.onText(/\/from (.+)/, (msg, match) => {
    if(validateCommand(msg)) {
        uz.stationSearch(match[1]).then(response => {
            switch (response.length) {
                case 0:
                    bot.sendMessage(msg.chat.id, 'Nothing found, try again please /from command');
                    break;
                case 1:
                    bot.sendMessage(msg.chat.id, 'Departure station is selected, please, search for departure station /to');
                    chats[chatId].from = match[1];
                    break;
                default:
                    bot.sendMessage(msg.chat.id, 'Selected departure station from list:', {
                        reply_to_message_id: msg.message_id,
                        reply_markup: JSON.stringify({
                            keyboard: response.map((station) => ['/from '+station])
                        })
                    });
            }
        });
    }
});


bot.onText(/\/to (.+)/, (msg, match) => {
    let chatId = msg.chat.id;

    if(validateCommand(msg)) {
        if(!chats[chatId].from)
            bot.sendMessage(chatId, 'Please, set up from station first using /from command');

        uz.stationSearch(match[1]).then(response => {
            switch (response.length) {
                case 0:
                    bot.sendMessage(msg.chat.id, 'Nothing found, try again please /to command');
                    break;
                case 1:
                    bot.sendMessage(msg.chat.id, 'Arrival station is selected, script will check each '+Math.round(scriptRepeatTime/60000) + ' minutes');
                    chats[chatId].to = match[1];
                    chats[chatId].lastResponse = '';
                    chats[chatId].interval = () => setInterval(() => execUzPing(chatId), scriptRepeatTime);

                    execUzPing(chatId);
                    break;
                default:
                    bot.sendMessage(msg.chat.id, 'Selected arrival station from list:', {
                        reply_to_message_id: msg.message_id,
                        reply_markup: JSON.stringify({
                            keyboard: response.map((station) => ['/from '+station])
                        })
                    });
            }
        });
    }

});


bot.onText(/\/status/, (msg, match) => {
    if(validateCommand(msg))
        bot.sendMessage(msg.chat.id, chats[chatId].lastResponse);
});



let validateCommand = (msg) => {
    if(!chats.hasOwnProperty(msg.chat.id))
        bot.sendMessage(msg.chat.id, 'To start script, please use /start command first');
    
    return chats.hasOwnProperty(msg.chat.id);
};


let execUzPing = (chatId) =>
    uz.ping(chats[chatId].from, chats[chatId].to).then(
        result => bot.sendMessage(chatId, result),
        error => chats[chatId].lastResponse = error
    );