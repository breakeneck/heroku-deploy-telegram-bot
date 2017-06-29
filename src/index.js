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

console.log('Bot Started, Waiting for /start command');
bot.onText(/\/start/, (msg, match) => {
    chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Script started');
    uz.ping().then(
        result => bot.sendMessage(chatId, result),
        error => bot.sendMessage(chatId, error)
    );
});

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
