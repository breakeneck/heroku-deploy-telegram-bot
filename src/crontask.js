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
const USER_ID = 390016459;
const LUTSK_ID = 2218060;
const DNIPRO_ID = 2210700;
const POLTAVA_KIEV_ID = 2204580;
const POLTAVA_PIVDENNA_ID = 2204590;


let schedulers = [
    /*{
        title: 'Луцьк - Дніпро',
        from: LUTSK_ID,
        to: DNIPRO_ID,
        at: '12.07.2017',
    },
    {
        title: 'Луцьк - Дніпро',
        from: LUTSK_ID,
        to: DNIPRO_ID,
        at: '13.07.2017',
    },*/
    {
        title: 'Дніпро - Луцьк',
        from: DNIPRO_ID,
        to: LUTSK_ID,
        at: '16.07.2017',
    },
    {
        title: 'Дніпро - Луцьк',
        from: DNIPRO_ID,
        to: LUTSK_ID,
        at: '17.07.2017',
    },
    {
        title: 'Полтава - Луцьк',
        from: POLTAVA_KIEV_ID,
        to: LUTSK_ID,
        at: '16.07.2017',
    },
    {
        title: 'Полтава - Луцьк',
        from: POLTAVA_KIEV_ID,
        to: LUTSK_ID,
        at: '17.07.2017',
    },
    {
        title: 'Полтава - Луцьк',
        from: POLTAVA_PIVDENNA_ID,
        to: LUTSK_ID,
        at: '16.07.2017',
    },
    {
        title: 'Полтава - Луцьк',
        from: POLTAVA_PIVDENNA_ID,
        to: LUTSK_ID,
        at: '17.07.2017',
    }];


uz.log('Cron script started');
// bot.sendMessage(USER_ID, 'Hello, friend');

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
            console.log(result);

            setTimeout(() => iterate(index + 1), TIMEOUT);
        },
        error => {
            // bot.sendMessage(USER_ID, `${sched.title} at ${sched.at} ${error}`);
            console.log(error);

            setTimeout(() => iterate(index + 1), TIMEOUT);
        }
    )
})(0);







/*
let searchTrain = (sched) =>
    uz.searchTrain(sched.from, sched.to, sched.at).then(
        result => (result) => {
            bot.sendMessage(USER_ID, result);
            console.log(`Searching for train ${sched.title} at ${sched.at}: ${result}`);
        },
        error => (error) => {
            bot.sendMessage(USER_ID, error);
            console.log(`Searching for train ${sched.title} at ${sched.at}: ${error}`);
        }
    );


let schedulers = [
    {
        title: 'Луцьк - Дніпро',
        from: LUTSK_ID,
        to: DNIPRO_ID,
        at: '12.07.2017',
    },{
        title: 'Луцьк - Дніпро',
        from: LUTSK_ID,
        to: DNIPRO_ID,
        at: '13.07.2017',
    },{
        title: 'Дніпро - Луцьк',
        from: DNIPRO_ID,
        to: LUTSK_ID,
        at: '16.07.2017',
    },{
        title: 'Дніпро - Луцьк',
        from: DNIPRO_ID,
        to: LUTSK_ID,
        at: '17.07.2017',
    }
];

schedulers.forEach((sched) => searchTrain);
process.exit();




let searchTrain = (sched) =>
    uz.searchTrain(sched.from, sched.to, sched.at).then(
        result => (result) => {
            bot.sendMessage(USER_ID, result);
            console.log(`Searching for train ${sched.title} at ${sched.at}: ${result}`);
        },
        error => (error) => {
            bot.sendMessage(USER_ID, error);
            console.log(`Searching for train ${sched.title} at ${sched.at}: ${error}`);
        }
    );

*/
