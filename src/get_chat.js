/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 06.11.2017
 */

import TelegramBot from 'node-telegram-bot-api';
const bot = new TelegramBot(token, {polling: true});


// RUNNING BOT
bot.onText(/\/start (.+)/, (msg, match) => {
    bot.sendMessage(msg.from.id, `ChatId = ${msg.chat_id}, UserId = ${msg.user.id}`);
});