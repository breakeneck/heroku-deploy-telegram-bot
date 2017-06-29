/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 29.06.2017
 */


import uz from './uz';
import helper from './helper';

let term = 'луц';
let station_id_from = '2218060';
let station_id_till = '2218400';
let date_dep = '30.07.2017';

// uz.searchTrain(station_id_from, station_id_till, date_dep)
//     .then(response => {
//         console.log(response);
//     });


// uz.searchStation(term)
//     .then(response => {
//         console.log(helper.buttonOpts('from', response).reply_markup.keyboard);
//     });


let chats = {};
let chatId = 123;
chats[chatId] = {
    id: chatId,
    interval: null,
    lastResponse: '',
    from:{},
    to: {},
    at: '',
};
let [action, stationId, stationTitle] = 'from_2210739_Дніпропетровськ Одб'.split('_');

chats[chatId][action] = {
    title: stationTitle,
    value: stationId
};

console.log(chats);