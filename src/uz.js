/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 28.06.2017
 */


import request from 'request';

const SEARCH_URL = 'http://booking.uz.gov.ua/purchase/search/';
const STATION_URL = 'http://booking.uz.gov.ua/purchase/station/';


const TIME_FORMAT = 'HH:mm:ss';
let moment = require('moment-timezone');
moment.tz.setDefault('America/New_York');

let time = () => moment().tz('Europe/Kiev').format('HH:mm:ss')+' - ';

exports.log = function() {
    let args = [].slice.call(arguments);
    args.unshift(time());

    console.log.apply(null, args);
};

exports.searchTrain = (station_id_from, station_id_till, date_dep) =>
    new Promise((resolve, reject) => {
        request.post(SEARCH_URL, {
            json: true,
            form:{
                station_id_from,
                station_id_till,
                date_dep
            }}, (e, r, body) => {
                // console.log(body);

                if(typeof body.value === 'string')
                    reject(time() + body.value);
                else
                    resolve(time() + formatResponse(body));
        });
    });

exports.searchStation = (term) =>
    new Promise((resolve, reject) => {
        request.get(STATION_URL, {
            json: true,
            qs: {
                term
            }}, (e, r, body) => {
                resolve(typeof body === 'string' ? [] : body);
        });
    });


// LOCAL HELPERS

let formatResponse = (body) => {
    let resultArr = [];
    body.value.forEach(value => {
        let tickets = value.types.map(type => {
            return type.places + ' ' + type.title;
        }).join("\n");
        let message = value.from.station+' - '+value.till.station+' '+value.from.src_date+"\n"+tickets`;
        resultArr.push(message);
    });
    console.log(resultArr.join("\n"));
    return resultArr.join("\n");
};



//
// let time = () => (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000))
//     .toISOString().replace('T',' ').split('.').shift()+' - ';

/*
exports.ping = (station_id_from, station_id_till, date_dep) => new Promise((resolve, reject) => {
    let params = {
        // station_id_from: 2218060,
        // station_from: 'Луцьк',
        // station_id_till: 2210700,
        // station_till: 'Дніпропетровськ-Голов.',
        // station_id_till: 2200001,
        // station_till: 'Київ',
        date_dep: date_dep,
        //date_dep: '12.07.2017',
        time_dep: '00:00',
        time_dep_till: '',
        another_ec:	0,
        search: ''
    };

    request
        .post({
            url: SEARCH_URL,
            json: true,
            form: {
                station_id_from,
                station_id_till,
                date_dep
            }
        }, (error, response, body) => {
            console.log('Params', params);

            if(!body || typeof body === 'string')
                return;

            if(typeof body.value === 'string') {
                console.log(time() + body.value);
                reject(time() + ' - Nothing found');
            }
            else {
                let resultArr = [];
                body.value.forEach(value => {
                    let tickets = value.types.map(type => {
                        return type.places + ' ' + type.title;
                    }).join("\n");
                    let message = `${value.from.station} - ${value.till.station} (${value.till.src_date}) \n${tickets}`;
                    resultArr.push(time() + ' - ' + message);
                });
                console.log(resultArr.join("\n"));
                resolve(resultArr.join("\n"));
            }
        });
});

exports.stationSearch = (query) => new Promise((resolve, reject) => {
    request
        .get({
            url: STATION_URL,
            json: true,
            qs: {term: query}
        }, (error, response, body) => {
            if (!body || typeof body === 'string')
                resolve([]);

            resolve(body);
        });
});
*/

//
// let Datastore = require('nedb');
// let db = new Datastore({ filename: 'db/items.nedb' });
// db.loadDatabase(err => err ? console.error('DB LOAD ERROR '+err) : '');