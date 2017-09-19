"use strict";

const fs = require('fs');
const json2csv = require('json2csv');
const config = require('./config.json');
const scraper = require('./scraper.js');

if (config.debug) require('request-debug')(request);

console.log('nim-utils\n=========\n');
console.log('Scraping ' + config.scraper.url + '...');

scraper.scrapeStudents()
  .then(studentData => {

    console.log('Scraping done! Saving...');

    let csvText = json2csv({ data: studentData });
    fs.writeFile(config.scraper.outputFile, csvText, err => {
      if (err) {
        return console.log(err);
      }
      console.log("File saved!");
    });    
  })
  .catch(err => {
    console.log(err);
  });
