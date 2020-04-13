#!/usr/bin/env node
const axios = require('axios');
const ora = require('ora');
const chalk = require('chalk');
const emoji = require('node-emoji');
const EMOJI = require('./weatherEmoji.js');

const method = process.argv[2];
const city = process.argv[3];
const AQI = {
  '优':      chalk.bgGreenBright,
  '良':      chalk.bgGreen,
  '轻度污染': chalk.bgYellowBright,
  '中度污染': chalk.bgYellow,
  '重度污染': chalk.bgRedBright,
  '严重污染': chalk.bgRed
}

/**
 * switch method
 */
switch(method) {
  case '-h':
  case '--help':
    help();
    break;
  case '-n':
  case '--name':
    searchByName();
    break;
  case '-v':
  case '--version':
    console.log(require('../package.json').version);
    break;
  default:
    errWarn();
    return;
}

/**
 * request by city name
 */
function searchByName() {
  let loading = ora('Loading result...').start();
  axios({
    url: `http://jisutqybmf.market.alicloudapi.com/weather/query?city=${encodeURI(city)}`,
    method: 'GET',
    headers: {
      Authorization: 'APPCODE 892b326edd8a4cab9c321e8bc29dfe9a'
    }
  })
    .then((resp) => {
      loading.stop();
      const data = resp.data;
      if (data.status === 0) {
        const res = data.result;
        console.log(chalk.green(`\t\t\t\t\t${res.city} 今日天气预报\n`));
        console.log(chalk.blue(`${res.city}\t${res.date}\t${res.week}`));
        console.log(`天气：${chalk.blue(`${res.weather}${emoji.get(EMOJI[res.img])}\t${res.templow} - ${res.temphigh} ℃`)}`);
        console.log(`风力：${chalk.blue(res.winddirect, res.windpower)}`);
        console.log(`pm2.5指数: ${chalk.green(res.aqi.ipm2_5)}`);
        console.log(AQI[res.aqi.quality].call(chalk, `空气质量: ${res.aqi.quality}`));
        
        console.log(chalk.green('\t\t\t\t\t未来7天天气预报'));
        console.log(getDaily(res.daily));
      } else {
        loading.stop();
        console.log(chalk.red('check your city name'));
      }
    })
    .catch((err) => {
      loading.stop();
      console.log(chalk.bgRed('[ERROR]'), chalk.red('something error, check your options or city name'));
    })
}

/**
 * options help
 */
function help() {
  console.log(chalk.blue('Usage:'), 'weather [options] arguments');
  console.log(chalk.blue('Options:'));
  console.log('\t', chalk.green('-h  --help\t'), 'Options help');
  console.log('\t', chalk.green('-v  --version\t'), 'get version');
  console.log('\t', chalk.green('-n  --name\t'), 'search weather by city name');
  console.log(chalk.blue('Example:'));
  console.log('\t', chalk.green('weather -n 黄山\t'), 'get city 「黄山」weather');
}

/**
 * error warn when don't have the method
 */
function errWarn() {
  console.log(chalk.bgRed('[ERROR]'), chalk.red(`no option name ${method}, use \`weather -h\` get help`));
}

/**
 * get hourly weather
 * @param  {[]} hourly
 * @return {string}
 */
function getHourly(hourly) {
  let res = '\t\t';

  hourly.map((item) => {
    res += `${item.time}\t${item.temp} ℃\t${item.weather}\t${emoji.get(EMOJI[item.img])}\n\t\t`;
  });

  return res;
}

/**
 * get daily weather
 * @param  {[]} daily
 * @return {string}
 */
function getDaily(daily) {
  let img = '', weather = '', temp = '', winddirect = '', windpower = '', week = '', date = '';

  daily.map((item) => {
    if (item.night.weather == item.day.weather) {
      img += `${emoji.get(EMOJI[item.day.img])}\t\t`;
      weather += `${item.day.weather}\t\t`;
    } else {
      img += `${emoji.get(EMOJI[item.night.img])}  ${emoji.get(EMOJI[item.day.img])}\t\t`;
      weather += `${item.night.weather}-${item.day.weather}\t`;
      if (`${item.night.weather}-${item.day.weather}`.length < 5) { weather += '\t'; }
    }
    temp += `${item.night.templow}-${item.day.temphigh}℃\t\t`;
    winddirect += `${item.day.winddirect}\t`;
    if (item.day.winddirect.length < 5) { winddirect += '\t' };
    windpower += `${item.day.windpower}\t\t`;
    week += `${item.week}\t\t`;
    date += `${item.date}\t`;
  });

  return `${img}\n${weather}\n${temp}\n${winddirect}\n${windpower}\n${week}\n${date}`;
}