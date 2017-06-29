import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';

const token = process.env.TOKEN;
const port = process.env.PORT;
const mode = process.env.NODE_ENV;
const url = `https://${process.env.HEROKU_NAME}.herokuapp.com/bot${token}`;

let bot;
bot = new TelegramBot(token, { webHook: { port } });
bot.setWebHook(url);

let chatId = null;
let scriptRepeatTime = 5*60*1000;
let interval = null;
let lastErrorMessage = '';

console.log('Bot Started, Waiting for /start command');

// RUNNING BOT
bot.onText(/\/start/, (msg, match) => {
    chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Script started');

    execUzPing();
    clearInterval(interval);
    interval = setInterval(execUzPing, scriptRepeatTime);
});

bot.onText(/\/status/, (msg, match) => {
    if(!chatId)
        bot.sendMessage(msg.chat.id, 'To start script, please use /start command first');
    else
        bot.sendMessage(chatId, lastErrorMessage);
});




let execUzPing = () =>
    uz.ping().then(
        result => bot.sendMessage(chatId, result),
        error => lastErrorMessage = error
    );



/*
let setInterval(() => )
console.log('app started');
uz.ping().then(
    result => {

    },
    error => {

    }
);



bot.on('message', (msg) => {
  if(msg.text === '/start')
      db.remove({ }, { multi: true }); // CLEAN ALL

  //db.find({ key: 'chatId' }, function (err, docs) {  });

  bot.sendMessage(msg.chat.id, msg.text);
});*/
