import TelegramBot from 'node-telegram-bot-api';
import ping from 'uzping';

const token = process.env.TOKEN;
const port = process.env.PORT;
const mode = process.env.NODE_ENV;

const url = `https://${process.env.HEROKU_NAME}.herokuapp.com/bot${token}`;
let bot;

let Datastore = require('nedb');
let db = new Datastore({ filename: 'db/items.nedb' });
db.loadDatabase(err => err ? console.error('DB LOAD ERROR '+err) : '');
//db.remove({ }, { multi: true }); // CLEAN ALL

console.log('app started');

if (mode === 'production') {
  bot = new TelegramBot(token, { webHook: { port } });
  bot.setWebHook(url);
} else {
  bot = new TelegramBot(token, { polling: true });
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  db.find({ system: 'solar' }, function (err, docs) {
      // docs is an array containing documents Mars, Earth, Jupiter
      // If no document is found, docs is equal to []
  });

  bot.sendMessage(chatId, msg.text);
});
