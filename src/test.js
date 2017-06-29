/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 29.06.2017
 */


import uz from './uz';

let term = 'луц';
let station_id_from = '2218060';
let station_id_till = '2218400';
let date_dep = '30.07.2017';

uz.searchTrain(station_id_from, station_id_till, date_dep)
    .then(response => {
        console.log(response);
    });


uz.searchStation(term)
    .then(response => {
        console.log(response);
    });