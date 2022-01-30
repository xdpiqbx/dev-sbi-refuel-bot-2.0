const format = require('date-fns/format');
const { uk } = require('date-fns/locale');

const botMessages = require('../../botMessages');

const {
  getCarByIdWithoutDriversIds,
  getInfoAboutCarWithDriversNames
} = require('../../db/car-db-queries');

const {
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('../../db/check-db-queries');

const {
  getDriverByIdWithCars,
  getDriverStatusByChatId,
  setTempCarIdForDriver,
  getTempCarId
} = require('../../db/driver-db-queries');

const ACTION = require('../../keyboards/inline-actions');
const actionCases = require('./actionCases');

const callbackQuery = bot => {
  bot.callbackQuery(async query => {
    const dataFromQuery = JSON.parse(query.data);
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const driverStatus = await getDriverStatusByChatId(chatId);
    const sendMessage = bot.sendMessage.bind(bot);
    switch (dataFromQuery.action) {
      case ACTION.CANDIDATE_YES_NO:
        bot.deleteMessage(chatId, messageId);
        actionCases.candidateYesNo(
          chatId,
          dataFromQuery,
          sendMessage,
          ACTION.ADD_NEW_DRIVER_TO_DB
        );
        break;
      case ACTION.CARS_FOR_REFUEL:
        bot.deleteMessage(chatId, messageId);
        actionCases.carsForRefuel(
          chatId,
          dataFromQuery,
          sendMessage,
          driverStatus.status
        );
        break;
      case ACTION.GIVE_OUT_FUEL:
        bot.deleteMessage(chatId, messageId);
        actionCases.giveOutFuel(chatId, dataFromQuery, sendMessage);
        break;
      case ACTION.ADD_NEW_DRIVER_TO_DB:
        bot.deleteMessage(chatId, messageId);
        actionCases.addNewDriverToDb(chatId, dataFromQuery, sendMessage);
        break;
      case ACTION.INFO_ABOUT_CAR:
        const car = await getInfoAboutCarWithDriversNames(dataFromQuery.id);
        bot.deleteMessage(chatId, messageId);
        botMessages.fullInfoAboutCar(
          sendMessage,
          chatId,
          car,
          driverStatus.status
        );
        break;
      case ACTION.INFO_ABOUT_DRIVER:
        const driver = await getDriverByIdWithCars(dataFromQuery.id);
        bot.deleteMessage(chatId, messageId);
        botMessages.fullInfoAboutDriver(sendMessage, chatId, driver);
        break;
      case ACTION.CAR_STATISTIC:
        await setTempCarIdForDriver(chatId, dataFromQuery.id);
        const carForStat = await getCarByIdWithoutDriversIds(dataFromQuery.id);

        const years = [2021, 2022];
        bot.deleteMessage(chatId, messageId);
        botMessages.getListOfYearsInline(
          sendMessage,
          chatId,
          years,
          carForStat,
          ACTION.GET_LIST_OF_YEARS
        );
        break;

      case ACTION.GET_LIST_OF_YEARS:
        const carId = await getTempCarId(chatId);
        const checksByCarId = await getChecksByCarId(
          carId.temp_carId,
          dataFromQuery.year
        );

        const carForStatRes = await getCarByIdWithoutDriversIds(
          carId.temp_carId
        );

        const getAllMonthses = checks => {
          const arrAllDates = checks.map(check => check.date);
          return arrAllDates.map(date => ({
            month: date.getMonth(),
            label: format(date, 'LLLL', { locale: uk })
          }));
        };

        const allMonthses = getAllMonthses(checksByCarId);

        const unicMonthsesNums = [
          ...new Set(allMonthses.map(item => item.month))
        ].sort((a, b) => a - b);

        const allUnicMonthses = unicMonthsesNums.map(monNum => {
          return allMonthses.find(m => m.month === monNum);
        });
        bot.deleteMessage(chatId, messageId);
        // вывести inline месяца в которых заправлялась машина
        botMessages.getListOfMonthesInline(
          sendMessage,
          chatId,
          allUnicMonthses,
          dataFromQuery.year,
          carForStatRes,
          ACTION.GET_STATS_FOR_MONTH
        );
        break;

      case ACTION.GET_STATS_FOR_MONTH:
        const idTmp = await getTempCarId(chatId);
        const checksByCarIdForSpecificMonth =
          await getChecksByCarIdForSpecificMonth(
            idTmp.temp_carId,
            dataFromQuery.month,
            dataFromQuery.year
          );
        const unicDates = [
          ...new Set(
            checksByCarIdForSpecificMonth.map(item => item.date.getDate())
          )
        ].sort((a, b) => a - b);
        const checksByDate = unicDates.map(date => {
          return checksByCarIdForSpecificMonth.filter(
            check => check.date.getDate() === date
          );
        });
        const resultArr = checksByDate.map(checksArr => {
          return {
            date: checksArr[0].date,
            litres: checksArr.reduce((acc, check) => (acc += check.litres), 0),
            imgsAndDrivers: checksArr.reduce((acc, check) => {
              acc.push({
                litres: check.litres,
                img: check.checkImageUrl,
                driver: check.driverId
              });
              return acc;
            }, [])
          };
        });
        const carForFinalStat = await getCarByIdWithoutDriversIds(
          idTmp.temp_carId
        );
        const monthTotalStat = {
          car: {
            model: carForFinalStat.model,
            number: carForFinalStat.number
          },
          monthLabel: format(resultArr[0].date, 'LLLL', { locale: uk }),
          data: resultArr
        };
        bot.deleteMessage(chatId, messageId);
        await setTempCarIdForDriver(chatId, null);
        botMessages.refuelStatForCarInSpecMonth(
          sendMessage,
          chatId,
          monthTotalStat
        );
        break;
    }
  });
};

module.exports = callbackQuery;
