"use strict";

const Bluebird = require('bluebird');
const retry = require('bluebird-retry');
const request = require('request');
const cheerio = require('cheerio');
const config = require('./config.json');

function scrapeStudents() {
  const majors = config.scraper.majors;
  const years = config.scraper.years;

  let nimQueue = [];

  for (let i = 0; i < majors.length; i++) {
    for (let j = 0; j < years.length; j++) {
      for (let k = 1; k <= 999; k++) {
        let nim = majors[i].toString() + (years[j] % 100).toString() + padStart(k.toString(), 3, '0');
        nimQueue.push(nim);
      }
    }
  }

  return Bluebird.map(nimQueue, (nim) => {
      return retry(scrapeStudent, { max_tries: 3, args: [nim] })
        .catch(err => { if (config.verbose) console.log('Error ignored for NIM ' + nim + ': ' + err); });
    }, { concurrency: config.scraper.maxConcurrentRequests })
    .filter(studentData => studentData != null && studentData != undefined && studentData.nim !== '');
}

function scrapeStudent(nim) {
  if (config.verbose) console.log('Scraping NIM ' + nim + '...');

  return new Promise((resolve, reject) => {

    const requestOptions = {
      url: config.scraper.url,
      headers: {
        'Cookie': config.scraper.sessionCookieName + '=' + config.scraper.sessionCookieValue
      },
      form: {
        uid: nim
      }
    }

    request.post(requestOptions, (err, res, html) => {
      if (err) {
        return reject(err);
      } else if (res.statusCode !== 200) {
        switch (res.statusCode) {
          case 302:
            return reject(new Error('Failed to scrape data: not logged in (HTTP 302)'));
          default:
            return reject(new Error('Failed to scrape data: non-successful status code ' + res.statusCode));
        }
      }
      
      let studentData;
      try {
        let $ = cheerio.load(html);
        let studentDataTable = $('table#tabel');
        studentData = {
          username: getTableRowValue(studentDataTable, 'Username'),
          name: getTableRowValue(studentDataTable, 'Nama Lengkap'),
          nim: getTableRowValue(studentDataTable, 'NIM').replace(/.*, (.*)/, '$1').trim(),
          tpb_nim: getTableRowValue(studentDataTable, 'NIM').replace(/(.*), .*/, '$1').trim(),
          email: getTableRowValue(studentDataTable, 'Email non ITB').replace(/\(at\)/ig, '@').replace(/\(dot\)/ig, '.'),
          itb_email: getTableRowValue(studentDataTable, 'Email ITB').replace(/\(at\)/ig, '@').replace(/\(dot\)/ig, '.'),
          account_type: getTableRowValue(studentDataTable, 'Tipe user'),
          account_status: getTableRowValue(studentDataTable, 'Status'),
          account_expiry: getTableRowValue(studentDataTable, 'Tanggal Expired').replace(/(\d+)\D+(\d+)\D+(\d+)/, '$3-$2-$1')
        };
      } catch (err) {
        return reject(err);
      }

      if (config.verbose) console.log('Received data for NIM ' + nim);
      return resolve(studentData);
    });
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function padStart(str, targetLength, padString) {
  targetLength = targetLength>>0; // floor if number or convert non-number to 0;
  padString = String(padString || ' ');
  if (str.length > targetLength) {
      return String(str);
  }
  else {
      targetLength = targetLength-str.length;
      if (targetLength > padString.length) {
          padString += padString.repeat(targetLength/padString.length); // append to original to ensure we are longer than needed
      }
      return padString.slice(0,targetLength) + String(str);
  }
};

function getTableRowValue(table, rowLabel) {
  return table
    .children()
    .find('tr > td')
    .filter((index, element) => cheerio(element).text().trim().toUpperCase() === rowLabel.toUpperCase())
    .siblings().last().text().trim();
}

module.exports = {
  scrapeStudents,
  scrapeStudent
};
