/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 05.07.2017
 */

import TelegramBot from 'node-telegram-bot-api';
import uz from './uz';
const fs = require('fs');

let bot;
const token = JSON.parse(fs.readFileSync(__dirname+'/../config/data.json')).telegram_token;
bot = new TelegramBot(token);//, {polling: true});

const TIMEOUT = 10000;
const USER_ID = 390016459; // YURI
// const USER_ID = 408632089; // NOT ME
const LUTSK_ID = 2218060;
const DNIPRO_ID = 2210700;
const POLTAVA_KIEV_ID = 2204580;
const POLTAVA_PIVDENNA_ID = 2204590;
const ODESSA_ID = 2208001;
const NOVOOLEKSIIVKA_ID = 2210790;

// echo some test commit to check HEAD update


let schedulers = [
    {
        title: 'Новоолексіївка - Луцьк',
        from: NOVOOLEKSIIVKA_ID,
        to: LUTSK_ID,
        at: '10.11.2017',
    },
];


uz.log('Cron script started');
// bot.sendMessage(USER_ID, 'Hello');

(function iterate(index) {
    if(index > schedulers.length -1) {
        uz.log('Script finished for all schedulers');
        process.exit(0);
    }

    let sched = schedulers[index];
    uz.log(`Task ${index} of ${schedulers.length -1}, search for ${sched.title} ${sched.at}`);

    uz.searchTrain(sched.from, sched.to, sched.at).then(
        result => {
            bot.sendMessage(USER_ID, `${sched.title} at ${sched.at} ${result}`);
            console.log(result);return;

            setTimeout(() => iterate(index + 1), TIMEOUT);
        },
        error => {
            // bot.sendMessage(USER_ID, `${sched.title} at ${sched.at} ${error}`);
            console.log(error);

            setTimeout(() => iterate(index + 1), TIMEOUT);
        }
    )
})(0);
