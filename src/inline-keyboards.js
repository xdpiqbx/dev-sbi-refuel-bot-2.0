const getCallbackData = (id, action) => {
  return JSON.stringify({
    id: id.toString(),
    action
  });
};
module.exports = {
  carsToInlineKeyboard: (cars, action) => {
    return cars.map(({ _id, number, model }) => {
      return [
        {
          text: `${number} - ${model}`,
          callback_data: getCallbackData(_id, action)
        }
      ];
    });
  },
  driversToInlineKeyboard: (drivers, action) => {
    return drivers.map(({ _id, name }) => {
      return [
        {
          text: name,
          callback_data: getCallbackData(_id, action)
        }
      ];
    });
  },
  driversWithoutChatIdToInlineKeyboard: (drivers, action) => {
    return drivers.map(({ _id, name }) => {
      return [
        {
          text: name,
          callback_data: getCallbackData(_id, action)
        }
      ];
    });
  },
  monthsesToInlineKeyboard: (monthses, action) => {
    return monthses.map(({ month, label }) => {
      return [
        {
          text: label,
          callback_data: JSON.stringify({
            month: month.toString(),
            action
          })
        }
      ];
    });
  }
};
