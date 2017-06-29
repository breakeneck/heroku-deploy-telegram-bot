/**
 * @file:
 * @author: Yuri Datsenko <yuri@hosteeva.com>
 * @date: 29.06.2017
 */


exports.validateCommand = (msg) => {
    if(!chats.hasOwnProperty(msg.chat.id))
        bot.sendMessage(msg.chat.id, 'To start script, please use /start command first');

    return chats.hasOwnProperty(msg.chat.id);
};


exports.execUzTrainSearch = (chatId) => {
    let chat = chats[chatId];
    uz.searchTrain(chat.from.value, chat.to.value, chat.at).then(
        result => bot.sendMessage(chatId, result),
        error => chat.lastResponse = error
    );
};

exports.hideKeyboardOpts = () => {
    return {
        reply_markup: JSON.stringify({
            hide_keyboard: true
        })
    }
};

exports.buttonOpts = (action, uzStationsResponse) => {
    return {
        reply_markup: {
            // resize_keyboard: true,
            // one_time_keyboard: true,
            keyboard: [
                uzStationsResponse.map((station) => {
                    return {
                        text: station.title,
                        callback_data: [action, station.value, station.title].join('_')
                    }
                })
            ]
        }
    }
};