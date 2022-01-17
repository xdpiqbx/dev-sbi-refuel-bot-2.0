module.exports = {
  sendReportWithCheckPhoto: (
    sendPhoto,
    chatId,
    car,
    litres,
    status,
    checkImageUrl
  ) => {
    const caption = [
      `Ви заправили:`,
      `Авто: <b>[ ${car.model} ]</b>`,
      `д.н.з.: <b>[ ${car.number} ]</b>`,
      `Заправлено на: <b>${litres}</b> літрів`
    ];
    if (status < 3) {
      caption.push(
        `Залишилось талонами: <b>${car.gasoline_residue}</b> літрів`
      );
    }
    sendPhoto(chatId, checkImageUrl, {
      caption: caption.join('\n'),
      parse_mode: 'HTML'
    });
  }
};
