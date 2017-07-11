/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 10.07.2017
 */



import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';
const fs = require('fs');

let bot;
const token = JSON.parse(fs.readFileSync(__dirname+'/../config/data.json')).telegram_token;
bot = new TelegramBot(token);//, {polling: true});

const TIMEOUT = 10000;
const USER_ID = 390016459;
const LUTSK_ID = 2218060;
const DNIPRO_ID = 2210700;

bot.sendMessage(USER_ID, "Yo\nHohohoho");