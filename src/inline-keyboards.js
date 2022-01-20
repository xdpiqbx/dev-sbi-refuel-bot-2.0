const getCallbackData = (id, action) => {
  return JSON.stringify({
    id: id.toString(),
    action
  });
};
module.exports = {
  candidateAddReject: (candidateChatId, action) => {
    const decision = [
      { text: 'Додати', val: true },
      { text: 'Відмовити', val: false }
    ];
    return decision.map(resp => {
      return [
        {
          text: resp.text,
          callback_data: JSON.stringify({
            val: resp.val,
            id: candidateChatId,
            action
          })
        }
      ];
    });
  },
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
  yearsToInlineKeyboard: (years, action) => {
    return years.map(year => {
      return [
        {
          text: year,
          callback_data: JSON.stringify({
            year,
            action
          })
        }
      ];
    });
  },
  monthsesToInlineKeyboard: (monthses, year, action) => {
    return monthses.map(({ month, label }) => {
      return [
        {
          text: label,
          callback_data: JSON.stringify({
            month: month.toString(),
            year,
            action
          })
        }
      ];
    });
  }
};
