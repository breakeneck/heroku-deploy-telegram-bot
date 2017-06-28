/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 28.06.2017
 */


import request from 'request';

const SEARCH_URL = 'http://booking.uz.gov.ua/purchase/search/';
const STATION_URL = 'http://booking.uz.gov.ua/purchase/station/?term=';

let time = () => (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000))
    .toISOString().replace('T',' ').split('.').shift();
let ping = () => {
    request
        .post({
            url: SEARCH_URL,
            json: true,
            form: {
                // station_id_from: 2218060,
                station_from: 'Луцьк',
                // station_id_till: 2210700,
                station_till: 'Дніпропетровськ-Голов.',
                // station_id_till: 2200001,
                // station_till: 'Київ',
                date_dep: '12.07.2017',
                time_dep: '00:00',
                time_dep_till: '',
                another_ec:	0,
                search: ''
            }
        }, (error, response, body) => {
            if(!body || typeof body === 'string')
                return;

            if(typeof body.value === 'string')
                console.log(time() + ' - Nothing found');
            else
                body.value.forEach(value => {
                    let tickets = value.types.map(type => {
                        return type.places + ' ' + type.title;
                    }).join("\n");
                    let message = `${value.from.station} - ${value.till.station} (${value.till.src_date}) \n${tickets}`;
                    console.log(time() + ' - ' + message);
                });
        });
};

export default ping;