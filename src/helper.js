/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 29.06.2017
 */


exports.hideKeyboardOpts = () => {
    return {
        reply_markup: JSON.stringify({
            hide_keyboard: true
        })
    }
};

exports.buttonOpts = (userId, action, uzStationsResponse) => {
    return {
        reply_markup: {
            // resize_keyboard: true,
            // one_time_keyboard: true,
            inline_keyboard: [
                uzStationsResponse.map((station) => {
                    return {
                        text: station.title,
                        callback_data: [userId, action, station.value, station.title].join('_')
                    }
                })
            ]
        }
    }
};