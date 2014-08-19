;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright (c) 2012 Sutoiku, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Some algorithms have been ported from Apache OpenOffice:

/**************************************************************
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 *************************************************************/
/*jslint evil: true*/
/*jshint -W079 */
/*global define */

(function () {
  var root = this;

  var Formula = root.Formula = {};
  var _ = root._;
  var numeric = root.numeric;
  var numeral = root.numeral;
  var jStat = root.jStat;
  var moment = root.moment;
  var lodash = root.lodash;

  if (typeof exports !== "undefined") {
    Formula = exports;

    _ = lodash = require('lodash');
    numeral = require('numeral');
    numeric = require('numeric');
    jStat = require('jStat').jStat;
    moment = require('moment');
    _.str = require('underscore.string');
  }
  else if (typeof define === "function" && define.amd) {
    define(
      'formula',
      ['numeric', 'numeral', 'jStat', 'moment', 'lodash', 'underscore.string'],
      function () {
        return Formula;
      }
    );
  }

  var _s = _.str;

  var MEMOIZED_FACT = [];

  var SQRT2PI = 2.5066282746310002;

  var WEEK_STARTS = [
    undefined,
    0,
    1,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    2,
    3,
    4,
    5,
    6,
    0
  ];

  var WEEK_TYPES = [
    [],
    [1, 2, 3, 4, 5, 6, 7],
    [7, 1, 2, 3, 4, 5, 6],
    [6, 0, 1, 2, 3, 4, 5],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [7, 1, 2, 3, 4, 5, 6],
    [6, 7, 1, 2, 3, 4, 5],
    [5, 6, 7, 1, 2, 3, 4],
    [4, 5, 6, 7, 1, 2, 3],
    [3, 4, 5, 6, 7, 1, 2],
    [2, 3, 4, 5, 6, 7, 1],
    [1, 2, 3, 4, 5, 6, 7]
  ];

  var WEEKEND_TYPES = [
    [],
    [6, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    undefined,
    undefined,
    undefined,
    [0],
    [1],
    [2],
    [3],
    [4],
    [5],
    [6]
  ];

  // Override some functions
  Formula.UNIQUE = function () {
    return lodash.unique(arguments);
  };

  Formula.FLATTEN = function () {
    return lodash.flatten(arguments);
  };

  // Generate a callback function
  Formula.FUNCTION = function () {
    var args = Array.prototype.slice.call(arguments);
    var expression = args[args.length - 1];
    var regexp = /(\w+)\(/g;
    var newExpression = expression.replace(regexp, function () {
      return "Formulae." + arguments[0];
    });

    args[args.length - 1] = "return " + newExpression + ";";
    if (newExpression !== expression) {
      args.unshift('Formulae');
    }

    return  Function.apply(null, args);
  };

  // Moment functions
  Formula.MOMENT = function (timestamp, format) {
    return moment(timestamp).format(format);
  };

  Formula.MOMENTADD = function (start_date, period, number) {
    return moment(start_date).add(period, number);
  };

  Formula.MOMENTDIFF = function (start_date, end_date, period) {
    return moment(end_date).diff(moment.utc(start_date), period);
  };

  Formula.MOMENTSUB = function (start_date, period, number) {
    return moment(start_date).subtract(period, number);
  };

  Formula.MOMENTUTC = function (timestamp, format) {
    return moment.utc(timestamp).format(format);
  };

  Formula.MOMENTUTCADD = function (start_date, period, number) {
    return moment.utc(start_date).add(period, number);
  };

  Formula.MOMENTUTCDIFF = function (start_date, end_date, period) {
    return moment.utc(end_date).diff(moment.utc(start_date), period);
  };

  Formula.MOMENTUTCSUB = function (start_date, period, number) {
    return moment.utc(start_date).subtract(period, number);
  };

  Formula.MOMENTUNIX = function (unixTime) {
    return moment.unix(unixTime).toDate();
  };

  Formula.MOMENTFORMAT = function (date, format) {
    return moment(date).format(format);
  };

  Formula.MOMENTISLEAPYEAR = function (date, format) {
    return moment(date, format).isLeapYear();
  };

  Formula.MOMENTISDST = function (date, format) {
    return moment(date, format).isDST();
  };

  Formula.MOMENTSTARTOF = function (date, units, format) {
    return moment(date, format).startOf(units).toDate();
  };

  Formula.MOMENTENDOF = function (date, units, format) {
    return moment(date, format).endOf(units).toDate();
  };

  Formula.MOMENTISAFTER = function (date1, date2, format) {
    return moment(date1, format).isAfter(moment(date2, format));
  };

  Formula.MOMENTISBEFORE = function (date1, date2, format) {
    return moment(date1, format).isBefore(moment(date2, format));
  };

  // Custom Functions
  Formula.ARGSCONCAT = function (args) {
    var result = [];
    for (var i = 0; i < args.length; i++) {
      result = result.concat(args[i]);
    }
    return result;
  };

  Formula.ARGSTOARRAY = function (args) {
    return Array.prototype.slice.call(args, 0);
  };

  Formula.CLEANFLOAT = function (number) {
    var power = Math.pow(10, 14);
    return Math.round(number * power) / power;
  };

  Formula.COUNTIN = function (range, value) {
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      if (range[i] === value) {
        result++;
      }
    }
    return result;
  };

  Formula.GETJSON = function (file) {
    var request = new XMLHttpRequest();
    request.open('GET', file, false);
    request.send(null);
    if (request.status === 200) {
      return JSON.parse(request.responseText);
    }
  };


  // Date functions

  Formula.DATE = function (year, month, day) {
    return new Date(year, month - 1, day);
  };

  Formula.DATEVALUE = function (date_text) {
    return Math.floor(( new Date(date_text) - new Date('1/1/1900')) / 86400000) + 2;
  };

  Formula.DAY = function (date) {
    return moment(new Date(date)).date();
  };

  Formula.DAYS = function (end_date, start_date) {
    return moment(new Date(end_date)).diff(moment(new Date(start_date)), 'days');
  };

  Formula.DAYS360 = function (start_date, end_date, method) {
    var start = moment(new Date(start_date));
    var end = moment(new Date(end_date));
    var smd = 31;
    var emd = 31;
    var sd = start.date();
    var ed = end.date();
    if (method) {
      sd = (sd === 31) ? 30 : sd;
      ed = (ed === 31) ? 30 : ed;
    }
    else {
      if (start.month() === 1) {
        smd = start.daysInMonth();
      }
      if (end.month() === 1) {
        emd = end.daysInMonth();
      }
      sd = (sd === smd) ? 30 : sd;
      if (sd === 30 || sd === smd) {
        ed = (ed === emd) ? 30 : ed;
      }
    }
    return 360 * (end.year() - start.year()) + 30 * (end.month() - start.month()) + (ed - sd);
  };

  Formula.EDATE = function (start_date, months) {
    return moment(new Date(start_date)).add('months', months).toDate();
  };

  Formula.EOMONTH = function (start_date, months) {
    var edate = moment(new Date(start_date)).add('months', months);
    return new Date(edate.year(), edate.month(), edate.daysInMonth());
  };

  Formula.HOUR = function (timestamp) {
    return (timestamp <= 1) ? Math.floor(24 * timestamp) : moment(new Date(timestamp)).hours();
  };

  Formula.MINUTE = function (timestamp) {
    return (timestamp <= 1) ? Math.floor(24 * 60 * timestamp) - 60 * Math.floor(24 * timestamp) : moment(new Date(timestamp)).minutes();
  };

  Formula.ISOWEEKNUM = function (date) {
    return moment(new Date(date)).format('w');
  };

  Formula.MONTH = function (timestamp) {
    return moment(new Date(timestamp)).month() + 1;
  };

  Formula.NETWORKDAYS = function (start_date, end_date, holidays) {
    return Formula.NETWORKDAYSINTL(start_date, end_date, 1, holidays);
  };

  Formula.NETWORKDAYSINTL = function (start_date, end_date, weekend, holidays) {
    var weekend_type = (typeof weekend === 'undefined') ? 1 : weekend;
    var weekend_days = WEEKEND_TYPES[weekend_type];
    var sd = moment(new Date(start_date));
    var ed = moment(new Date(end_date));
    var net_days = ed.diff(sd, 'days') + 1;
    var net_work_days = net_days;
    var day_of_week = '';
    var cd = sd;
    var holiday_dates = [];
    if (typeof holidays !== 'undefined') {
      for (var i = 0; i < holidays.length; i++) {
        holiday_dates[i] = moment(new Date(holidays[i])).format('MM-DD-YYYY');
      }
    }
    var j = 1;
    while (j < net_days) {
      day_of_week = cd.format('d');
      if (weekend_days.indexOf(parseInt(day_of_week, 10)) >= 0) {
        net_work_days--;
      } else if (holiday_dates.indexOf(cd.format('MM-DD-YYYY')) >= 0) {
        net_work_days--;
      }
      cd = cd.add('days', 1);
      j++;
    }
    return net_work_days;
  };

  Formula.NOW = function () {
    return new Date();
  };

  Formula.SECOND = function (timestamp) {
    return moment(new Date(timestamp)).seconds();
  };

  Formula.TIME = function (hour, minute, second) {
    return (3600 * hour + 60 * minute + second) / 86400;
  };

  Formula.TIMEVALUE = function (time_text) {
    var timestamp = moment(new Date(time_text));
    return (3600 * timestamp.hours() + 60 * timestamp.minutes() + timestamp.seconds()) / 86400;
  };

  Formula.TODAY = function () {
    return new Date();
  };

  Formula.WEEKDAY = function (date, type) {
    var week_day = moment(new Date(date)).format('d');
    var week_type = (typeof type === 'undefined') ? 1 : type;
    return WEEK_TYPES[week_type][week_day];
  };

  Formula.WEEKNUM = function (date, type) {
    var current_date = moment(new Date(date));
    var january_first = moment(new Date(current_date.year(), 0, 1));
    var week_type = (typeof type === 'undefined') ? 1 : type;
    var week_start = WEEK_STARTS[week_type];
    var first_day = january_first.format('d');
    var offset = (first_day < week_start) ? week_start - first_day + 1 : first_day - week_start;
    if (week_type === 21) {
      return Formula.ISOWEEKNUM(date);
    } else {
      return Math.floor(current_date.diff(january_first.subtract('days', offset), 'days') / 7) + 1;
    }
  };

  Formula.WORKDAY = function (start_date, days, holidays) {
    return Formula.WORKDAYINTL(start_date, days, 1, holidays);
  };

  Formula.WORKDAYINTL = function (start_date, days, weekend, holidays) {
    var weekend_type = (typeof weekend === 'undefined') ? 1 : weekend;
    var weekend_days = WEEKEND_TYPES[weekend_type];
    var sd = moment(new Date(start_date));
    var cd = sd;
    var day_of_week = '';
    var holiday_dates = [];
    if (typeof holidays !== 'undefined') {
      for (var i = 0; i < holidays.length; i++) {
        holiday_dates[i] = moment(new Date(holidays[i])).format('MM-DD-YYYY');
      }
    }
    var j = 0;
    while (j < days) {
      cd = cd.add('days', 1);
      day_of_week = cd.format('d');
      if (weekend_days.indexOf(parseInt(day_of_week, 10)) < 0 && holiday_dates.indexOf(cd.format('MM-DD-YYYY')) < 0) {
        j++;
      }
    }
    return cd.toDate();
  };

  Formula.YEAR = function (date) {
    return moment(new Date(date)).year();
  };

  Formula.YEARFRAC = function (start_date, end_date, basis) {
    // Credits: David A. Wheeler [http://www.dwheeler.com/]

    // Initialize parameters
    basis = (typeof basis === 'undefined') ? 0 : basis;
    var sdate = moment(new Date(start_date));
    var edate = moment(new Date(end_date));

    // Return error if either date is invalid
    if (!sdate.isValid() || !edate.isValid()) {
      return '#VALUE!';
    }

    // Return error if basis is neither 0, 1, 2, 3, or 4
    if ([0, 1, 2, 3, 4].indexOf(basis) === -1) {
      return '#NUM!';
    }

    // Return zero if start_date and end_date are the same
    if (sdate === edate) {
      return 0;
    }

    // Swap dates if start_date is later than end_date
    if (sdate.diff(edate) > 0) {
      edate = moment(new Date(start_date));
      sdate = moment(new Date(end_date));
    }

    // Lookup years, months, and days
    var syear = sdate.year();
    var smonth = sdate.month();
    var sday = sdate.date();
    var eyear = edate.year();
    var emonth = edate.month();
    var eday = edate.date();

    switch (basis) {
      case 0:
        // US (NASD) 30/360
        // Note: if eday == 31, it stays 31 if sday < 30
        if (sday === 31 && eday === 31) {
          sday = 30;
          eday = 30;
        } else if (sday === 31) {
          sday = 30;
        } else if (sday === 30 && eday === 31) {
          eday = 30;
        } else if (smonth === 1 && emonth === 1 && sdate.daysInMonth() === sday && edate.daysInMonth() === eday) {
          sday = 30;
          eday = 30;
        } else if (smonth === 1 && sdate.daysInMonth() === sday) {
          sday = 30;
        }
        return ((eday + emonth * 30 + eyear * 360) - (sday + smonth * 30 + syear * 360)) / 360;

      case 1:
        // Actual/actual
        var feb29Between = function (date1, date2) {
          // Requires year2 == (year1 + 1) or year2 == year1
          // Returns TRUE if February 29 is between the two dates (date1 may be February 29), with two possibilities:
          // year1 is a leap year and date1 <= Februay 29 of year1
          // year2 is a leap year and date2 > Februay 29 of year2

          var mar1year1 = moment(new Date(date1.year(), 2, 1));
          if (moment([date1.year()]).isLeapYear() && date1.diff(mar1year1) < 0 && date2.diff(mar1year1) >= 0) {
            return true;
          }
          var mar1year2 = moment(new Date(date2.year(), 2, 1));
          if (moment([date2.year()]).isLeapYear() && date2.diff(mar1year2) >= 0 && date1.diff(mar1year2) < 0) {
            return true;
          }
          return false;
        };
        var ylength = 365;
        if (syear === eyear || ((syear + 1) === eyear) && ((smonth > emonth) || ((smonth === emonth) && (sday >= eday)))) {
          if (syear === eyear && moment([syear]).isLeapYear()) {
            ylength = 366;
          } else if (feb29Between(sdate, edate) || (emonth === 1 && eday === 29)) {
            ylength = 366;
          }
          return edate.diff(sdate, 'days') / ylength;
        } else {
          var years = (eyear - syear) + 1;
          var days = moment(new Date(eyear + 1, 0, 1)).diff(moment(new Date(syear, 0, 1)), 'days');
          var average = days / years;
          return edate.diff(sdate, 'days') / average;
        }
        break;

      case 2:
        // Actual/360
        return edate.diff(sdate, 'days') / 360;

      case 3:
        // Actual/365
        return edate.diff(sdate, 'days') / 365;

      case 4:
        // European 30/360
        if (sday === 31) {
          sday = 30;
        }

        if (eday === 31) {
          eday = 30;
        }
        // Remarkably, do NOT change February 28 or February 29 at ALL
        return ((eday + emonth * 30 + eyear * 360) - (sday + smonth * 30 + syear * 360)) / 360;
    }
  };


  // Engineering functions

  Formula.BESSELI = function () {
    return;
  };

  Formula.BESSELJ = function () {
    return;
  };

  Formula.BESSELK = function () {
    return;
  };

  Formula.BESSELY = function () {
    return;
  };

  Formula.VALIDBIN = function (number) {
    return (/^[01]{1,10}$/).test(number);
  };

  Formula.BIN2DEC = function (number) {
    // Return error if number is not binary or contains more than 10 characters (10 digits)
    if (!Formula.VALIDBIN(number)) {
      return '#NUM!';
    }

    // Convert binary number to decimal
    var result = parseInt(number, 2);

    // Handle negative numbers
    var stringified = number.toString();
    if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
      return parseInt(stringified.substring(1), 2) - 512;
    } else {
      return result;
    }
  };

  Formula.BIN2HEX = function (number, places) {
    // Return error if number is not binary or contains more than 10 characters (10 digits)
    if (!Formula.VALIDBIN(number)) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character hexadecimal number if number is negative
    var stringified = number.toString();
    if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
      return (1099511627264 + parseInt(stringified.substring(1), 2)).toString(16);
    }

    // Convert binary number to hexadecimal
    var result = parseInt(number, 2).toString(16);

    // Return hexadecimal number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.BIN2OCT = function (number, places) {
    // Return error if number is not binary or contains more than 10 characters (10 digits)
    if (!Formula.VALIDBIN(number)) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character octal number if number is negative
    var stringified = number.toString();
    if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
      return (1073741312 + parseInt(stringified.substring(1), 2)).toString(8);
    }

    // Convert binary number to octal
    var result = parseInt(number, 2).toString(8);

    // Return octal number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.BITAND = function (number1, number2) {
    // Return error if either number is a non-numeric value
    if (isNaN(number1) || isNaN(number2)) {
      return '#VALUE!';
    }

    // Return error if either number is less than 0
    if (number1 < 0 || number2 < 0) {
      return '#NUM!';
    }

    // Return error if either number is a non-integer
    if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
      return '#NUM!';
    }

    // Return error if either number is greater than (2^48)-1
    if (number1 > 281474976710655 || number2 > 281474976710655) {
      return '#NUM!';
    }

    // Return bitwise AND of two numbers
    return number1 & number2;
  };

  Formula.BITLSHIFT = function (number, shift) {
    // Return error if either number is a non-numeric value
    if (isNaN(number) || isNaN(shift)) {
      return '#VALUE!';
    }

    // Return error if number is less than 0
    if (number < 0) {
      return '#NUM!';
    }

    // Return error if number is a non-integer
    if (Math.floor(number) !== number) {
      return '#NUM!';
    }

    // Return error if number is greater than (2^48)-1
    if (number > 281474976710655) {
      return '#NUM!';
    }

    // Return error if the absolute value of shift is greater than 53
    if (Math.abs(shift) > 53) {
      return '#NUM!';
    }

    // Return number shifted by shift bits to the left or to the right if shift is negative
    return (shift >= 0 ) ? number << shift : number >> -shift;
  };

  Formula.BITOR = function (number1, number2) {
    // Return error if either number is a non-numeric value
    if (isNaN(number1) || isNaN(number2)) {
      return '#VALUE!';
    }

    // Return error if either number is less than 0
    if (number1 < 0 || number2 < 0) {
      return '#NUM!';
    }

    // Return error if either number is a non-integer
    if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
      return '#NUM!';
    }

    // Return error if either number is greater than (2^48)-1
    if (number1 > 281474976710655 || number2 > 281474976710655) {
      return '#NUM!';
    }

    // Return bitwise OR of two numbers
    return number1 | number2;
  };

  Formula.BITRSHIFT = function (number, shift) {
    // Return error if either number is a non-numeric value
    if (isNaN(number) || isNaN(shift)) {
      return '#VALUE!';
    }

    // Return error if number is less than 0
    if (number < 0) {
      return '#NUM!';
    }

    // Return error if number is a non-integer
    if (Math.floor(number) !== number) {
      return '#NUM!';
    }

    // Return error if number is greater than (2^48)-1
    if (number > 281474976710655) {
      return '#NUM!';
    }

    // Return error if the absolute value of shift is greater than 53
    if (Math.abs(shift) > 53) {
      return '#NUM!';
    }

    // Return number shifted by shift bits to the right or to the left if shift is negative
    return (shift >= 0 ) ? number >> shift : number << -shift;
  };

  Formula.BITXOR = function (number1, number2) {
    // Return error if either number is a non-numeric value
    if (isNaN(number1) || isNaN(number2)) {
      return '#VALUE!';
    }

    // Return error if either number is less than 0
    if (number1 < 0 || number2 < 0) {
      return '#NUM!';
    }

    // Return error if either number is a non-integer
    if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
      return '#NUM!';
    }

    // Return error if either number is greater than (2^48)-1
    if (number1 > 281474976710655 || number2 > 281474976710655) {
      return '#NUM!';
    }

    // Return bitwise XOR of two numbers
    return number1 ^ number2;
  };

  Formula.COMPLEX = function (real, imaginary, suffix) {
    // Return error if either number is a non-numeric value
    if (isNaN(real) || isNaN(imaginary)) {
      return '#VALUE!';
    }

    // Set suffix
    suffix = (typeof suffix === 'undefined') ? 'i' : suffix;

    // Return error if suffix is neither "i" nor "j"
    if (suffix !== 'i' && suffix !== 'j') {
      return '#VALUE!';
    }

    // Return complex number
    if (real === 0 && imaginary === 0) {
      return 0;
    } else if (real === 0) {
      return (imaginary === 1) ? suffix : imaginary.toString() + suffix;
    } else if (imaginary === 0) {
      return real.toString();
    } else {
      var sign = (imaginary > 0) ? '+' : '';
      return real.toString() + sign + ((imaginary === 1) ? suffix : imaginary.toString() + suffix);
    }
  };

  Formula.CONVERT = function (number, from_unit, to_unit) {
    // Return error if number is a non-numeric value
    if (isNaN(number)) {
      return '#VALUE!';
    }

    // List of units supported by CONVERT and units defined by the International System of Units
    // [Name, Symbol, Alternate symbols, Quantity, ISU, CONVERT, Conversion ratio]
    var units = [
      ["a.u. of action", "?", null, "action", false, false, 1.05457168181818e-34],
      ["a.u. of charge", "e", null, "electric_charge", false, false, 1.60217653141414e-19],
      ["a.u. of energy", "Eh", null, "energy", false, false, 4.35974417757576e-18],
      ["a.u. of length", "a?", null, "length", false, false, 5.29177210818182e-11],
      ["a.u. of mass", "m?", null, "mass", false, false, 9.10938261616162e-31],
      ["a.u. of time", "?/Eh", null, "time", false, false, 2.41888432650516e-17],
      ["admiralty knot", "admkn", null, "speed", false, true, 0.514773333],
      ["ampere", "A", null, "electric_current", true, false, 1],
      ["ampere per meter", "A/m", null, "magnetic_field_intensity", true, false, 1],
      ["ångström", "Å", ["ang"], "length", false, true, 1e-10],
      ["are", "ar", null, "area", false, true, 100],
      ["astronomical unit", "ua", null, "length", false, false, 1.49597870691667e-11],
      ["bar", "bar", null, "pressure", false, false, 100000],
      ["barn", "b", null, "area", false, false, 1e-28],
      ["becquerel", "Bq", null, "radioactivity", true, false, 1],
      ["bit", "bit", ["b"], "information", false, true, 1],
      ["btu", "BTU", ["btu"], "energy", false, true, 1055.05585262],
      ["byte", "byte", null, "information", false, true, 8],
      ["candela", "cd", null, "luminous_intensity", true, false, 1],
      ["candela per square metre", "cd/m?", null, "luminance", true, false, 1],
      ["coulomb", "C", null, "electric_charge", true, false, 1],
      ["cubic ångström", "ang3", ["ang^3"], "volume", false, true, 1e-30],
      ["cubic foot", "ft3", ["ft^3"], "volume", false, true, 0.028316846592],
      ["cubic inch", "in3", ["in^3"], "volume", false, true, 0.000016387064],
      ["cubic light-year", "ly3", ["ly^3"], "volume", false, true, 8.46786664623715e-47],
      ["cubic metre", "m?", null, "volume", true, true, 1],
      ["cubic mile", "mi3", ["mi^3"], "volume", false, true, 4168181825.44058],
      ["cubic nautical mile", "Nmi3", ["Nmi^3"], "volume", false, true, 6352182208],
      ["cubic Pica", "Pica3", ["Picapt3", "Pica^3", "Picapt^3"], "volume", false, true, 7.58660370370369e-8],
      ["cubic yard", "yd3", ["yd^3"], "volume", false, true, 0.764554857984],
      ["cup", "cup", null, "volume", false, true, 0.0002365882365],
      ["dalton", "Da", ["u"], "mass", false, false, 1.66053886282828e-27],
      ["day", "d", ["day"], "time", false, true, 86400],
      ["degree", "°", null, "angle", false, false, 0.0174532925199433],
      ["degrees Rankine", "Rank", null, "temperature", false, true, 0.555555555555556],
      ["dyne", "dyn", ["dy"], "force", false, true, 0.00001],
      ["electronvolt", "eV", ["ev"], "energy", false, true, 1.60217656514141],
      ["ell", "ell", null, "length", false, true, 1.143],
      ["erg", "erg", ["e"], "energy", false, true, 1e-7],
      ["farad", "F", null, "electric_capacitance", true, false, 1],
      ["fluid ounce", "oz", null, "volume", false, true, 0.0000295735295625],
      ["foot", "ft", null, "length", false, true, 0.3048],
      ["foot-pound", "flb", null, "energy", false, true, 1.3558179483314],
      ["gal", "Gal", null, "acceleration", false, false, 0.01],
      ["gallon", "gal", null, "volume", false, true, 0.003785411784],
      ["gauss", "G", ["ga"], "magnetic_flux_density", false, true, 1],
      ["grain", "grain", null, "mass", false, true, 0.0000647989],
      ["gram", "g", null, "mass", false, true, 0.001],
      ["gray", "Gy", null, "absorbed_dose", true, false, 1],
      ["gross registered ton", "GRT", ["regton"], "volume", false, true, 2.8316846592],
      ["hectare", "ha", null, "area", false, true, 10000],
      ["henry", "H", null, "inductance", true, false, 1],
      ["hertz", "Hz", null, "frequency", true, false, 1],
      ["horsepower", "HP", ["h"], "power", false, true, 745.69987158227],
      ["horsepower-hour", "HPh", ["hh", "hph"], "energy", false, true, 2684519.538],
      ["hour", "h", ["hr"], "time", false, true, 3600],
      ["imperial gallon (U.K.)", "uk_gal", null, "volume", false, true, 0.00454609],
      ["imperial hundredweight", "lcwt", ["uk_cwt", "hweight"], "mass", false, true, 50.802345],
      ["imperial quart (U.K)", "uk_qt", null, "volume", false, true, 0.0011365225],
      ["imperial ton", "brton", ["uk_ton", "LTON"], "mass", false, true, 1016.046909],
      ["inch", "in", null, "length", false, true, 0.0254],
      ["international acre", "uk_acre", null, "area", false, true, 4046.8564224],
      ["IT calorie", "cal", null, "energy", false, true, 4.1868],
      ["joule", "J", null, "energy", true, true, 1],
      ["katal", "kat", null, "catalytic_activity", true, false, 1],
      ["kelvin", "K", ["kel"], "temperature", true, true, 1],
      ["kilogram", "kg", null, "mass", true, true, 1],
      ["knot", "kn", null, "speed", false, true, 0.514444444444444],
      ["light-year", "ly", null, "length", false, true, 9460730472580800],
      ["litre", "L", ["l", "lt"], "volume", false, true, 0.001],
      ["lumen", "lm", null, "luminous_flux", true, false, 1],
      ["lux", "lx", null, "illuminance", true, false, 1],
      ["maxwell", "Mx", null, "magnetic_flux", false, false, 1e-18],
      ["measurement ton", "MTON", null, "volume", false, true, 1.13267386368],
      ["meter per hour", "m/h", ["m/hr"], "speed", false, true, 0.00027777777777778],
      ["meter per second", "m/s", ["m/sec"], "speed", true, true, 1],
      ["meter per second squared", "m?s??", null, "acceleration", true, false, 1],
      ["parsec", "pc", ["parsec"], "length", false, true, 30856775814671900],
      ["meter squared per second", "m?/s", null, "kinematic_viscosity", true, false, 1],
      ["metre", "m", null, "length", true, true, 1],
      ["miles per hour", "mph", null, "speed", false, true, 0.44704],
      ["millimetre of mercury", "mmHg", null, "pressure", false, false, 133.322],
      ["minute", "?", null, "angle", false, false, 0.000290888208665722],
      ["minute", "min", ["mn"], "time", false, true, 60],
      ["modern teaspoon", "tspm", null, "volume", false, true, 0.000005],
      ["mole", "mol", null, "amount_of_substance", true, false, 1],
      ["morgen", "Morgen", null, "area", false, true, 2500],
      ["n.u. of action", "?", null, "action", false, false, 1.05457168181818e-34],
      ["n.u. of mass", "m?", null, "mass", false, false, 9.10938261616162e-31],
      ["n.u. of speed", "c?", null, "speed", false, false, 299792458],
      ["n.u. of time", "?/(me?c??)", null, "time", false, false, 1.28808866778687e-21],
      ["nautical mile", "M", ["Nmi"], "length", false, true, 1852],
      ["newton", "N", null, "force", true, true, 1],
      ["œrsted", "Oe ", null, "magnetic_field_intensity", false, false, 79.5774715459477],
      ["ohm", "Ω", null, "electric_resistance", true, false, 1],
      ["ounce mass", "ozm", null, "mass", false, true, 0.028349523125],
      ["pascal", "Pa", null, "pressure", true, false, 1],
      ["pascal second", "Pa?s", null, "dynamic_viscosity", true, false, 1],
      ["pferdestärke", "PS", null, "power", false, true, 735.49875],
      ["phot", "ph", null, "illuminance", false, false, 0.0001],
      ["pica (1/6 inch)", "pica", null, "length", false, true, 0.00035277777777778],
      ["pica (1/72 inch)", "Pica", ["Picapt"], "length", false, true, 0.00423333333333333],
      ["poise", "P", null, "dynamic_viscosity", false, false, 0.1],
      ["pond", "pond", null, "force", false, true, 0.00980665],
      ["pound force", "lbf", null, "force", false, true, 4.4482216152605],
      ["pound mass", "lbm", null, "mass", false, true, 0.45359237],
      ["quart", "qt", null, "volume", false, true, 0.000946352946],
      ["radian", "rad", null, "angle", true, false, 1],
      ["second", "?", null, "angle", false, false, 0.00000484813681109536],
      ["second", "s", ["sec"], "time", true, true, 1],
      ["short hundredweight", "cwt", ["shweight"], "mass", false, true, 45.359237],
      ["siemens", "S", null, "electrical_conductance", true, false, 1],
      ["sievert", "Sv", null, "equivalent_dose", true, false, 1],
      ["slug", "sg", null, "mass", false, true, 14.59390294],
      ["square ångström", "ang2", ["ang^2"], "area", false, true, 1e-20],
      ["square foot", "ft2", ["ft^2"], "area", false, true, 0.09290304],
      ["square inch", "in2", ["in^2"], "area", false, true, 0.00064516],
      ["square light-year", "ly2", ["ly^2"], "area", false, true, 8.95054210748189e+31],
      ["square meter", "m?", null, "area", true, true, 1],
      ["square mile", "mi2", ["mi^2"], "area", false, true, 2589988.110336],
      ["square nautical mile", "Nmi2", ["Nmi^2"], "area", false, true, 3429904],
      ["square Pica", "Pica2", ["Picapt2", "Pica^2", "Picapt^2"], "area", false, true, 0.00001792111111111],
      ["square yard", "yd2", ["yd^2"], "area", false, true, 0.83612736],
      ["statute mile", "mi", null, "length", false, true, 1609.344],
      ["steradian", "sr", null, "solid_angle", true, false, 1],
      ["stilb", "sb", null, "luminance", false, false, 0.0001],
      ["stokes", "St", null, "kinematic_viscosity", false, false, 0.0001],
      ["stone", "stone", null, "mass", false, true, 6.35029318],
      ["tablespoon", "tbs", null, "volume", false, true, 0.0000147868],
      ["teaspoon", "tsp", null, "volume", false, true, 0.00000492892],
      ["tesla", "T", null, "magnetic_flux_density", true, true, 1],
      ["thermodynamic calorie", "c", null, "energy", false, true, 4.184],
      ["ton", "ton", null, "mass", false, true, 907.18474],
      ["tonne", "t", null, "mass", false, false, 1000],
      ["U.K. pint", "uk_pt", null, "volume", false, true, 0.00056826125],
      ["U.S. bushel", "bushel", null, "volume", false, true, 0.03523907],
      ["U.S. oil barrel", "barrel", null, "volume", false, true, 0.158987295],
      ["U.S. pint", "pt", ["us_pt"], "volume", false, true, 0.000473176473],
      ["U.S. survey mile", "survey_mi", null, "length", false, true, 1609.347219],
      ["U.S. survey/statute acre", "us_acre", null, "area", false, true, 4046.87261],
      ["volt", "V", null, "voltage", true, false, 1],
      ["watt", "W", null, "power", true, true, 1],
      ["watt-hour", "Wh", ["wh"], "energy", false, true, 3600],
      ["weber", "Wb", null, "magnetic_flux", true, false, 1],
      ["yard", "yd", null, "length", false, true, 0.9144],
      ["year", "yr", null, "time", false, true, 31557600]
    ];

    // Binary prefixes
    // [Name, Prefix power of 2 value, Previx value, Abbreviation, Derived from]
    var binary_prefixes = {
      Yi: ["yobi", 80, 1208925819614629174706176, "Yi", "yotta"],
      Zi: ["zebi", 70, 1180591620717411303424, "Zi", "zetta"],
      Ei: ["exbi", 60, 1152921504606846976, "Ei", "exa"],
      Pi: ["pebi", 50, 1125899906842624, "Pi", "peta"],
      Ti: ["tebi", 40, 1099511627776, "Ti", "tera"],
      Gi: ["gibi", 30, 1073741824, "Gi", "giga"],
      Mi: ["mebi", 20, 1048576, "Mi", "mega"],
      ki: ["kibi", 10, 1024, "ki", "kilo"]
    };

    // Unit prefixes
    // [Name, Multiplier, Abbreviation]
    var unit_prefixes = {
      Y: ["yotta", 1e+24, "Y"],
      Z: ["zetta", 1e+21, "Z"],
      E: ["exa", 1e+18, "E"],
      P: ["peta", 1e+15, "P"],
      T: ["tera", 1e+12, "T"],
      G: ["giga", 1e+09, "G"],
      M: ["mega", 1e+06, "M"],
      k: ["kilo", 1e+03, "k"],
      h: ["hecto", 1e+02, "h"],
      e: ["dekao", 1e+01, "e"],
      d: ["deci", 1e-01, "d"],
      c: ["centi", 1e-02, "c"],
      m: ["milli", 1e-03, "m"],
      u: ["micro", 1e-06, "u"],
      n: ["nano", 1e-09, "n"],
      p: ["pico", 1e-12, "p"],
      f: ["femto", 1e-15, "f"],
      a: ["atto", 1e-18, "a"],
      z: ["zepto", 1e-21, "z"],
      y: ["yocto", 1e-24, "y"]
    };

    // Initialize units and multipliers
    var from = null;
    var to = null;
    var base_from_unit = from_unit;
    var base_to_unit = to_unit;
    var from_multiplier = 1;
    var to_multiplier = 1;
    var alt;

    // Lookup from and to units
    for (var i = 0; i < units.length; i++) {
      alt = (units[i][2] === null) ? [] : units[i][2];
      if (units[i][1] === base_from_unit || alt.indexOf(base_from_unit) >= 0) {
        from = units[i];
      }
      if (units[i][1] === base_to_unit || alt.indexOf(base_to_unit) >= 0) {
        to = units[i];
      }
    }

    // Lookup from prefix
    if (from === null) {
      var from_binary_prefix = binary_prefixes[from_unit.substring(0, 2)];
      var from_unit_prefix = unit_prefixes[from_unit.substring(0, 1)];

      // Handle dekao unit prefix (only unit prefix with two characters)
      if (from_unit.substring(0, 2) === 'da') {
        from_unit_prefix = ["dekao", 1e+01, "da"];
      }

      // Handle binary prefixes first (so that 'Yi' is processed before 'Y')
      if (from_binary_prefix) {
        from_multiplier = from_binary_prefix[2];
        base_from_unit = from_unit.substring(2);
      } else if (from_unit_prefix) {
        from_multiplier = from_unit_prefix[1];
        base_from_unit = from_unit.substring(from_unit_prefix[2].length);
      }

      // Lookup from unit
      for (var j = 0; j < units.length; j++) {
        alt = (units[j][2] === null) ? [] : units[j][2];
        if (units[j][1] === base_from_unit || alt.indexOf(base_from_unit) >= 0) {
          from = units[j];
        }
      }
    }

    // Lookup to prefix
    if (to === null) {
      var to_binary_prefix = binary_prefixes[to_unit.substring(0, 2)];
      var to_unit_prefix = unit_prefixes[to_unit.substring(0, 1)];

      // Handle dekao unit prefix (only unit prefix with two characters)
      if (to_unit.substring(0, 2) === 'da') {
        to_unit_prefix = ["dekao", 1e+01, "da"];
      }

      // Handle binary prefixes first (so that 'Yi' is processed before 'Y')
      if (to_binary_prefix) {
        to_multiplier = to_binary_prefix[2];
        base_to_unit = to_unit.substring(2);
      } else if (to_unit_prefix) {
        to_multiplier = to_unit_prefix[1];
        base_to_unit = to_unit.substring(to_unit_prefix[2].length);
      }

      // Lookup to unit
      for (var k = 0; k < units.length; k++) {
        alt = (units[k][2] === null) ? [] : units[k][2];
        if (units[k][1] === base_to_unit || alt.indexOf(base_to_unit) >= 0) {
          to = units[k];
        }
      }
    }

    // Return error if a unit does not exist
    if (from === null || to === null) {
      return '#N/A';
    }

    // Return error if units represent different quantities
    if (from[3] !== to[3]) {
      return '#N/A';
    }

    // Return converted number
    return number * from[6] * from_multiplier / (to[6] * to_multiplier);
  };

  Formula.DEC2BIN = function (number, places) {
    // Return error if number is not a number
    if (isNaN(number)) {
      return '#VALUE!';
    }

    // Return error if number is not decimal, is lower than -512, or is greater than 511
    if (!/^-?[0-9]{1,3}$/.test(number) || number < -512 || number > 511) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character binary number if number is negative
    if (number < 0) {
      return '1' + _s.repeat('0', 9 - (512 + number).toString(2).length) + (512 + number).toString(2);
    }

    // Convert decimal number to binary
    var result = parseInt(number, 10).toString(2);

    // Return binary number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.DEC2HEX = function (number, places) {
    // Return error if number is not a number
    if (isNaN(number)) {
      return '#VALUE!';
    }

    // Return error if number is not decimal, is lower than -549755813888, or is greater than 549755813887
    if (!/^-?[0-9]{1,12}$/.test(number) || number < -549755813888 || number > 549755813887) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character hexadecimal number if number is negative
    if (number < 0) {
      return (1099511627776 + number).toString(16);
    }

    // Convert decimal number to hexadecimal
    var result = parseInt(number, 10).toString(16);

    // Return hexadecimal number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.DEC2OCT = function (number, places) {
    // Return error if number is not a number
    if (isNaN(number)) {
      return '#VALUE!';
    }

    // Return error if number is not decimal, is lower than -549755813888, or is greater than 549755813887
    if (!/^-?[0-9]{1,9}$/.test(number) || number < -536870912 || number > 536870911) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character octal number if number is negative
    if (number < 0) {
      return (1073741824 + number).toString(8);
    }

    // Convert decimal number to octal
    var result = parseInt(number, 10).toString(8);

    // Return octal number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.DELTA = function (number1, number2) {
    // Set number2 to zero if undefined
    number2 = (typeof number2 === 'undefined') ? 0 : number2;

    // Return error if either number is not a number
    if (isNaN(number1) || isNaN(number2)) {
      return '#VALUE!';
    }

    // Return delta
    return (number1 === number2) ? 1 : 0;
  };

  Formula.ERF = function (lower_bound, upper_bound) {
    // Set number2 to zero if undefined
    upper_bound = (typeof upper_bound === 'undefined') ? 0 : upper_bound;

    // Return error if either number is not a number
    if (isNaN(lower_bound) || isNaN(upper_bound)) {
      return '#VALUE!';
    }

    // Return ERFC using jStat [http://www.jstat.org/]
    return jStat.erf(lower_bound);
  };

  Formula.ERFC = function (x) {
    // Return error if x is not a number
    if (isNaN(x)) {
      return '#VALUE!';
    }

    // Return ERFC using jStat [http://www.jstat.org/]
    return jStat.erfc(x);
  };

  Formula.ERFCPRECISE = function () {
    return;
  };

  Formula.ERFPRECISE = function () {
    return;
  };

  Formula.GESTEP = function (number, step) {
    // Set step to zero if undefined
    step = (typeof step === 'undefined') ? 0 : step;

    // Return error if either number is not a number
    if (isNaN(number) || isNaN(step)) {
      return '#VALUE!';
    }

    // Return delta
    return (number >= step) ? 1 : 0;
  };

  Formula.HEX2BIN = function (number, places) {

    // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
    if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
      return '#NUM!';
    }

    // Check if number is negative
    var negative = (number.length === 10 && number.substring(0, 1).toLowerCase() === 'f') ? true : false;

    // Convert hexadecimal number to decimal
    var decimal = (negative) ? parseInt(number, 16) - 1099511627776 : parseInt(number, 16);

    // Return error if number is lower than -512 or greater than 511
    if (decimal < -512 || decimal > 511) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character binary number if number is negative
    if (negative) {
      return '1' + _s.repeat('0', 9 - (512 + decimal).toString(2).length) + (512 + decimal).toString(2);
    }

    // Convert decimal number to binary
    var result = decimal.toString(2);

    // Return binary number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.HEX2DEC = function (number) {
    // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
    if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
      return '#NUM!';
    }

    // Convert hexadecimal number to decimal
    var decimal = parseInt(number, 16);

    // Return decimal number
    return (decimal >= 549755813888) ? decimal - 1099511627776 : decimal;
  };

  Formula.HEX2OCT = function (number, places) {
    // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
    if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
      return '#NUM!';
    }

    // Convert hexadecimal number to decimal
    var decimal = parseInt(number, 16);

    // Return error if number is positive and greater than 0x1fffffff (536870911)
    if (decimal > 536870911 && decimal < 1098974756864) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character octal number if number is negative
    if (decimal >= 1098974756864) {
      return (decimal - 1098437885952).toString(8);
    }

    // Convert decimal number to octal
    var result = decimal.toString(8);

    // Return octal number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.IMABS = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return absolute value of complex number
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  };

  Formula.IMAGINARY = function (inumber) {
    // Return 0 if inumber is equal to 0
    if (inumber === 0 || inumber === '0') {
      return 0;
    }

    // Handle special cases
    if (['i', 'j'].indexOf(inumber) >= 0) {
      return 1;
    }

    // Normalize imaginary coefficient
    inumber = inumber.replace('+i', '+1i').replace('-i', '-1i').replace('+j', '+1j').replace('-j', '-1j');

    // Lookup sign
    var plus = inumber.indexOf('+');
    var minus = inumber.indexOf('-');
    if (plus === 0) {
      plus = inumber.indexOf('+', 1);
    }

    if (minus === 0) {
      minus = inumber.indexOf('-', 1);
    }

    // Lookup imaginary unit
    var last = inumber.substring(inumber.length - 1, inumber.length);
    var unit = (last === 'i' || last === 'j');

    if (plus >= 0 || minus >= 0) {
      // Return error if imaginary unit is neither i nor j
      if (!unit) {
        return '#NUM!';
      }

      // Return imaginary coefficient of complex number
      if (plus >= 0) {
        return (isNaN(inumber.substring(0, plus)) || isNaN(inumber.substring(plus + 1, inumber.length - 1))) ?
          '#NUM!' :
          Number(inumber.substring(plus + 1, inumber.length - 1));
      } else {
        return (isNaN(inumber.substring(0, minus)) || isNaN(inumber.substring(minus + 1, inumber.length - 1))) ?
          '#NUM!' :
          -Number(inumber.substring(minus + 1, inumber.length - 1));
      }
    } else {
      if (unit) {
        return (isNaN(inumber.substring(0, inumber.length - 1))) ? '#NUM!' : inumber.substring(0, inumber.length - 1);
      } else {
        return (isNaN(inumber)) ? '#NUM!' : 0;
      }
    }
  };

  Formula.IMARGUMENT = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return error if inumber is equal to zero
    if (x === 0 && y === 0) {
      return '#DIV/0!';
    }

    // Return PI/2 if x is equal to zero and y is positive
    if (x === 0 && y > 0) {
      return Math.PI / 2;
    }

    // Return -PI/2 if x is equal to zero and y is negative
    if (x === 0 && y < 0) {
      return -Math.PI / 2;
    }

    // Return zero if x is negative and y is equal to zero
    if (y === 0 && x > 0) {
      return 0;
    }

    // Return zero if x is negative and y is equal to zero
    if (y === 0 && x < 0) {
      return -Math.PI;
    }

    // Return argument of complex number
    if (x > 0) {
      return Math.atan(y / x);
    } else if (x < 0 && y >= 0) {
      return Math.atan(y / x) + Math.PI;
    } else {
      return Math.atan(y / x) - Math.PI;
    }
  };

  Formula.IMCONJUGATE = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return conjugate of complex number
    return (y !== 0) ? Formula.COMPLEX(x, -y, unit) : inumber;
  };

  Formula.IMCOS = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return cosine of complex number
    return Formula.COMPLEX(Math.cos(x) * (Math.exp(y) + Math.exp(-y)) / 2, -Math.sin(x) * (Math.exp(y) - Math.exp(-y)) / 2, unit);
  };

  Formula.IMCOSH = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return hyperbolic cosine of complex number
    return Formula.COMPLEX(Math.cos(y) * (Math.exp(x) + Math.exp(-x)) / 2, Math.sin(y) * (Math.exp(x) - Math.exp(-x)) / 2, unit);
  };

  Formula.IMCOT = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return cotangent of complex number
    return Formula.IMDIV(Formula.IMCOS(inumber), Formula.IMSIN(inumber));
  };

  Formula.IMCSC = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return cosecant of complex number
    return Formula.IMDIV('1', Formula.IMSIN(inumber));
  };

  Formula.IMCSCH = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return hyperbolic cosecant of complex number
    return Formula.IMDIV('1', Formula.IMSINH(inumber));
  };

  Formula.IMDIV = function (inumber1, inumber2) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var a = Formula.IMREAL(inumber1);
    var b = Formula.IMAGINARY(inumber1);
    var c = Formula.IMREAL(inumber2);
    var d = Formula.IMAGINARY(inumber2);

    // Lookup imaginary unit
    var unit1 = inumber1.substring(inumber1.length - 1);
    var unit2 = inumber1.substring(inumber1.length - 1);
    var unit = 'i';
    if (unit1 === 'j') {
      unit = 'j';
    } else if (unit2 === 'j') {
      unit = 'j';
    }

    // Return error if either coefficient is not a number
    if (a === '#NUM!' || b === '#NUM!' || c === '#NUM!' || d === '#NUM!') {
      return '#NUM!';
    }

    // Return error if inumber2 is null
    if (c === 0 && d === 0) {
      return '#NUM!';
    }

    // Return exponential of complex number
    var den = c * c + d * d;
    return Formula.COMPLEX((a * c + b * d) / den, (b * c - a * d) / den, unit);
  };

  Formula.IMEXP = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return exponential of complex number
    var e = Math.exp(x);
    return Formula.COMPLEX(e * Math.cos(y), e * Math.sin(y), unit);
  };

  Formula.IMLN = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return exponential of complex number
    return Formula.COMPLEX(Math.log(Math.sqrt(x * x + y * y)), Math.atan(y / x), unit);
  };

  Formula.IMLOG10 = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return exponential of complex number
    return Formula.COMPLEX(Math.log(Math.sqrt(x * x + y * y)) / Math.log(10), Math.atan(y / x) / Math.log(10), unit);
  };

  Formula.IMLOG2 = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return exponential of complex number
    return Formula.COMPLEX(Math.log(Math.sqrt(x * x + y * y)) / Math.log(2), Math.atan(y / x) / Math.log(2), unit);
  };

  Formula.IMPOWER = function (inumber, number) {
    // Return error if number is nonnumeric
    if (isNaN(number)) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Calculate power of modulus
    var p = Math.pow(Formula.IMABS(inumber), number);

    // Calculate argument
    var t = Formula.IMARGUMENT(inumber);

    // Return exponential of complex number
    return Formula.COMPLEX(p * Math.cos(number * t), p * Math.sin(number * t), unit);
  };

  Formula.IMPRODUCT = function () {
    // Initialize result
    var result = arguments[0];

    // Loop on all numbers
    for (var i = 1; i < arguments.length; i++) {
      // Lookup coefficients of two complex numbers
      var a = Formula.IMREAL(result);
      var b = Formula.IMAGINARY(result);
      var c = Formula.IMREAL(arguments[i]);
      var d = Formula.IMAGINARY(arguments[i]);

      // Return error if either coefficient is not a number
      if (a === '#NUM!' || b === '#NUM!' || c === '#NUM!' || d === '#NUM!') {
        return '#NUM!';
      }

      // Complute product of two complex numbers
      result = Formula.COMPLEX(a * c - b * d, a * d + b * c);
    }

    // Return product of complex numbers
    return result;
  };

  Formula.IMREAL = function (inumber) {
    // Return 0 if inumber is equal to 0
    if (inumber === 0 || inumber === '0') {
      return 0;
    }

    // Handle special cases
    if (['i', '+i', '1i', '+1i', '-i', '-1i', 'j', '+j', '1j', '+1j', '-j', '-1j'].indexOf(inumber) >= 0) {
      return 0;
    }

    // Lookup sign
    var plus = inumber.indexOf('+');
    var minus = inumber.indexOf('-');
    if (plus === 0) {
      plus = inumber.indexOf('+', 1);
    }
    if (minus === 0) {
      minus = inumber.indexOf('-', 1);
    }

    // Lookup imaginary unit
    var last = inumber.substring(inumber.length - 1, inumber.length);
    var unit = (last === 'i' || last === 'j');

    if (plus >= 0 || minus >= 0) {
      // Return error if imaginary unit is neither i nor j
      if (!unit) {
        return '#NUM!';
      }

      // Return real coefficient of complex number
      if (plus >= 0) {
        return (isNaN(inumber.substring(0, plus)) || isNaN(inumber.substring(plus + 1, inumber.length - 1))) ?
          '#NUM!' :
          Number(inumber.substring(0, plus));
      } else {
        return (isNaN(inumber.substring(0, minus)) || isNaN(inumber.substring(minus + 1, inumber.length - 1))) ?
          '#NUM!' :
          Number(inumber.substring(0, minus));
      }
    } else {
      if (unit) {
        return (isNaN(inumber.substring(0, inumber.length - 1))) ? '#NUM!' : 0;
      } else {
        return (isNaN(inumber)) ? '#NUM!' : inumber;
      }
    }
  };

  Formula.IMSEC = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return secant of complex number
    return Formula.IMDIV('1', Formula.IMCOS(inumber));
  };

  Formula.IMSECH = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return hyperbolic secant of complex number
    return Formula.IMDIV('1', Formula.IMCOSH(inumber));
  };

  Formula.IMSIN = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return sine of complex number
    return Formula.COMPLEX(Math.sin(x) * (Math.exp(y) + Math.exp(-y)) / 2, Math.cos(x) * (Math.exp(y) - Math.exp(-y)) / 2, unit);
  };

  Formula.IMSINH = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return hyperbolic sine of complex number
    return Formula.COMPLEX(Math.cos(y) * (Math.exp(x) - Math.exp(-x)) / 2, Math.sin(y) * (Math.exp(x) + Math.exp(-x)) / 2, unit);
  };

  Formula.IMSQRT = function (inumber) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Lookup imaginary unit
    var unit = inumber.substring(inumber.length - 1);
    unit = (unit === 'i' || unit === 'j') ? unit : 'i';

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Calculate power of modulus
    var s = Math.sqrt(Formula.IMABS(inumber));

    // Calculate argument
    var t = Formula.IMARGUMENT(inumber);

    // Return exponential of complex number
    return Formula.COMPLEX(s * Math.cos(t / 2), s * Math.sin(t / 2), unit);
  };

  Formula.IMSUB = function (inumber1, inumber2) {
    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var a = Formula.IMREAL(inumber1);
    var b = Formula.IMAGINARY(inumber1);
    var c = Formula.IMREAL(inumber2);
    var d = Formula.IMAGINARY(inumber2);

    // Lookup imaginary unit
    var unit1 = inumber1.substring(inumber1.length - 1);
    var unit2 = inumber1.substring(inumber1.length - 1);
    var unit = 'i';
    if (unit1 === 'j') {
      unit = 'j';
    } else if (unit2 === 'j') {
      unit = 'j';
    }

    // Return error if either coefficient is not a number
    if (a === '#NUM!' || b === '#NUM!' || c === '#NUM!' || d === '#NUM!') {
      return '#NUM!';
    }

    // Return _ of two complex numbers
    return Formula.COMPLEX(a - c, b - d, unit);
  };

  Formula.IMSUM = function () {
    // Initialize result
    var result = arguments[0];

    // Loop on all numbers
    for (var i = 1; i < arguments.length; i++) {
      // Lookup coefficients of two complex numbers
      var a = Formula.IMREAL(result);
      var b = Formula.IMAGINARY(result);
      var c = Formula.IMREAL(arguments[i]);
      var d = Formula.IMAGINARY(arguments[i]);

      // Return error if either coefficient is not a number
      if (a === '#NUM!' || b === '#NUM!' || c === '#NUM!' || d === '#NUM!') {
        return '#NUM!';
      }

      // Complute product of two complex numbers
      result = Formula.COMPLEX(a + c, b + d);
    }

    // Return sum of complex numbers
    return result;
  };

  Formula.IMTAN = function (inumber) {
    // Return error if inumber is a logical value
    if (inumber === true || inumber === false) {
      return '#VALUE!';
    }

    // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
    var x = Formula.IMREAL(inumber);
    var y = Formula.IMAGINARY(inumber);

    // Return error if either coefficient is not a number
    if (x === '#NUM!' || y === '#NUM!') {
      return '#NUM!';
    }

    // Return tangent of complex number
    return Formula.IMDIV(Formula.IMSIN(inumber), Formula.IMCOS(inumber));
  };

  Formula.OCT2BIN = function (number, places) {
    // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
    if (!/^[0-7]{1,10}$/.test(number)) {
      return '#NUM!';
    }

    // Check if number is negative
    var negative = (number.length === 10 && number.substring(0, 1) === '7') ? true : false;

    // Convert octal number to decimal
    var decimal = (negative) ? parseInt(number, 8) - 1073741824 : parseInt(number, 8);

    // Return error if number is lower than -512 or greater than 511
    if (decimal < -512 || decimal > 511) {
      return '#NUM!';
    }

    // Ignore places and return a 10-character binary number if number is negative
    if (negative) {
      return '1' + _s.repeat('0', 9 - (512 + decimal).toString(2).length) + (512 + decimal).toString(2);
    }

    // Convert decimal number to binary
    var result = decimal.toString(2);

    // Return binary number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };

  Formula.OCT2DEC = function (number) {
    // Return error if number is not octal or contains more than ten characters (10 digits)
    if (!/^[0-7]{1,10}$/.test(number)) {
      return '#NUM!';
    }

    // Convert octal number to decimal
    var decimal = parseInt(number, 8);

    // Return decimal number
    return (decimal >= 536870912) ? decimal - 1073741824 : decimal;
  };

  Formula.OCT2HEX = function (number, places) {
    // Return error if number is not octal or contains more than ten characters (10 digits)
    if (!/^[0-7]{1,10}$/.test(number)) {
      return '#NUM!';
    }

    // Convert octal number to decimal
    var decimal = parseInt(number, 8);

    // Ignore places and return a 10-character octal number if number is negative
    if (decimal >= 536870912) {
      return 'ff' + (decimal + 3221225472).toString(16);
    }

    // Convert decimal number to hexadecimal
    var result = decimal.toString(16);

    // Return hexadecimal number using the minimum number of characters necessary if places is undefined
    if (typeof places === 'undefined') {
      return result;
    } else {
      // Return error if places is nonnumeric
      if (isNaN(places)) {
        return '#VALUE!';
      }

      // Return error if places is negative
      if (places < 0) {
        return '#NUM!';
      }

      // Truncate places in case it is not an integer
      places = Math.floor(places);

      // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
      return (places >= result.length) ? _s.repeat('0', places - result.length) + result : '#NUM!';
    }
  };


  // Financial functions

  Formula.ACCRINT = function (issue, first, settlement, rate, par, frequency, basis, method) {
    // Return error if either date is invalid
    if (!moment(issue).isValid() || !moment(first).isValid() || !moment(settlement).isValid()) {
      return '#VALUE!';
    }

    // Return error if either rate or par are lower than or equal to zero
    if (rate <= 0 || par <= 0) {
      return '#NUM!';
    }

    // Return error if frequency is neither 1, 2, or 4
    if ([1, 2, 4].indexOf(frequency) === -1) {
      return '#NUM!';
    }

    // Return error if basis is neither 0, 1, 2, 3, or 4
    if ([0, 1, 2, 3, 4].indexOf(basis) === -1) {
      return '#NUM!';
    }

    // Return error if issue greater than or equal to settlement
    if (moment(issue).diff(moment(settlement)) >= 0) {
      return '#NUM!';
    }

    // Set default values
    par = (typeof par === 'undefined') ? 0 : par;
    basis = (typeof basis === 'undefined') ? 0 : basis;
    method = (typeof method === 'undefined') ? true : method;

    // Compute accrued interest
    var factor = 0;
    var id = moment(new Date(issue));
    var fd = moment(new Date(first));
    var sd = moment(new Date(settlement));
    var days = (moment([id.year()]).isLeapYear()) ? 366 : 365;

    switch (basis) {
      case 0:
        // US (NASD) 30/360
        factor = Formula.YEARFRAC(issue, settlement, basis);
        break;
      case 1:
        // Actual/actual
        factor = Formula.YEARFRAC(issue, settlement, basis);
        break;
      case 2:
        // Actual/360
        factor = Formula.YEARFRAC(issue, settlement, basis);
        break;
      case 3:
        // Actual/365
        factor = Formula.YEARFRAC(issue, settlement, basis);
        break;
      case 4:
        // European 30/360
        factor = Formula.YEARFRAC(issue, settlement, basis);
        break;
    }
    return par * rate * factor;
  };

  Formula.ACCRINTM = function () {
    return;
  };

  Formula.AMORDEGRC = function () {
    return;
  };

  Formula.AMORLINC = function () {
    return;
  };

  Formula.COUPDAYBS = function () {
    return;
  };

  Formula.COUPDAYS = function () {
    return;
  };

  Formula.COUPDAYSNC = function () {
    return;
  };

  Formula.COUPNCD = function () {
    return;
  };

  Formula.COUPNUM = function () {
    return;
  };

  Formula.COUPPCD = function () {
    return;
  };

  Formula.CUMIPMT = function (rate, periods, value, start, end, type) {
    // Credits: algorithm inspired by Apache OpenOffice
    // Credits: Hannes Stiebitzhofer for the translations of function and variable names
    // Requires Formula.FV() and Formula.PMT() from Formula.js [http://stoic.com/formula/]

    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);
    periods = eval(periods);

    // Return error if either rate, periods, or value are lower than or equal to zero
    if (rate <= 0 || periods <= 0 || value <= 0) {
      return '#NUM!';
    }

    // Return error if start < 1, end < 1, or start > end
    if (start < 1 || end < 1 || start > end) {
      return '#NUM!';
    }

    // Return error if type is neither 0 nor 1
    if (type !== 0 && type !== 1) {
      return '#NUM!';
    }

    // Compute cumulative interest
    var payment = Formula.PMT(rate, periods, value, 0, type);
    var interest = 0;

    if (start === 1) {
      if (type === 0) {
        interest = -value;
        start++;
      }
    }

    for (var i = start; i <= end; i++) {
      if (type === 1) {
        interest += Formula.FV(rate, i - 2, payment, value, 1) - payment;
      } else {
        interest += Formula.FV(rate, i - 1, payment, value, 0);
      }
    }
    interest *= rate;

    // Return cumulative interest
    return interest;
  };

  Formula.CUMPRINC = function (rate, periods, value, start, end, type) {
    // Credits: algorithm inspired by Apache OpenOffice
    // Credits: Hannes Stiebitzhofer for the translations of function and variable names
    // Requires Formula.FV() and Formula.PMT() from Formula.js [http://stoic.com/formula/]

    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);
    periods = eval(periods);

    // Return error if either rate, periods, or value are lower than or equal to zero
    if (rate <= 0 || periods <= 0 || value <= 0) {
      return '#NUM!';
    }

    // Return error if start < 1, end < 1, or start > end
    if (start < 1 || end < 1 || start > end) {
      return '#NUM!';
    }

    // Return error if type is neither 0 nor 1
    if (type !== 0 && type !== 1) {
      return '#NUM!';
    }

    // Compute cumulative principal
    var payment = Formula.PMT(rate, periods, value, 0, type);
    var principal = 0;
    if (start === 1) {
      if (type === 0) {
        principal = payment + value * rate;
      } else {
        principal = payment;
      }
      start++;
    }
    for (var i = start; i <= end; i++) {
      if (type > 0) {
        principal += payment - (Formula.FV(rate, i - 2, payment, value, 1) - payment) * rate;
      } else {
        principal += payment - Formula.FV(rate, i - 1, payment, value, 0) * rate;
      }
    }

    // Return cumulative principal
    return principal;
  };

  Formula.DB = function (cost, salvage, life, period, month) {
    // Initialize month
    month = (typeof month === 'undefined') ? 12 : month;

    // Return error if any of the parameters is not a number
    if (isNaN(cost) || isNaN(salvage) || isNaN(life) || isNaN(period) || isNaN(month)) {
      return '#VALUE!';
    }

    // Return error if any of the parameters is negative   [

    if (cost < 0 || salvage < 0 || life < 0 || period < 0) {
      return '#NUM!';
    }

    // Return error if month is not an integer between 1 and 12
    if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(month) === -1) {
      return '#NUM!';
    }

    // Return error if period is greater than life
    if (period > life) {
      return '#NUM!';
    }

    // Return 0 (zero) if salvage is greater than or equal to cost
    if (salvage >= cost) {
      return 0;
    }

    // Rate is rounded to three decimals places
    var rate = (1 - Math.pow(salvage / cost, 1 / life)).toFixed(3);

    // Compute initial depreciation
    var initial = cost * rate * month / 12;

    // Compute total depreciation
    var total = initial;
    var current = 0;
    var ceiling = (period === life) ? life - 1 : period;
    for (var i = 2; i <= ceiling; i++) {
      current = (cost - total) * rate;
      total += current;
    }

    // Depreciation for the first and last periods are special cases
    if (period === 1) {
      // First period
      return initial;
    } else if (period === life) {
      // Last period
      return (cost - total) * rate;
    } else {
      return current;
    }
  };

  Formula.DDB = function (cost, salvage, life, period, factor) {
    // Initialize factor
    factor = (typeof factor === 'undefined') ? 2 : factor;

    // Return error if any of the parameters is not a number
    if (isNaN(cost) || isNaN(salvage) || isNaN(life) || isNaN(period) || isNaN(factor)) {
      return '#VALUE!';
    }

    // Return error if any of the parameters is negative or if factor is null
    if (cost < 0 || salvage < 0 || life < 0 || period < 0 || factor <= 0) {
      return '#NUM!';
    }

    // Return error if period is greater than life
    if (period > life) {
      return '#NUM!';
    }

    // Return 0 (zero) if salvage is greater than or equal to cost
    if (salvage >= cost) {
      return 0;
    }

    // Compute depreciation
    var total = 0;
    var current = 0;
    for (var i = 1; i <= period; i++) {
      current = Math.min((cost - total) * (factor / life), (cost - salvage - total));
      total += current;
    }

    // Return depreciation
    return current;
  };

  Formula.DISC = function () {
    return;
  };

  Formula.DOLLARDE = function (dollar, fraction) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Return error if any of the parameters is not a number
    if (isNaN(dollar) || isNaN(fraction)) {
      return '#VALUE!';
    }

    // Return error if fraction is negative
    if (fraction < 0) {
      return '#NUM!';
    }

    // Return error if fraction is greater than or equal to 0 and less than 1
    if (fraction >= 0 && fraction < 1) {
      return '#DIV/0!';
    }

    // Truncate fraction if it is not an integer
    fraction = parseInt(fraction, 10);

    // Compute integer part
    var result = parseInt(dollar, 10);

    // Add decimal part
    result += (dollar % 1) * Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN10)) / fraction;

    // Round result
    var power = Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN2) + 1);
    result = Math.round(result * power) / power;

    // Return converted dollar price
    return result;
  };

  Formula.DOLLARFR = function (dollar, fraction) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Return error if any of the parameters is not a number
    if (isNaN(dollar) || isNaN(fraction)) {
      return '#VALUE!';
    }

    // Return error if fraction is negative
    if (fraction < 0) {
      return '#NUM!';
    }

    // Return error if fraction is greater than or equal to 0 and less than 1
    if (fraction >= 0 && fraction < 1) {
      return '#DIV/0!';
    }

    // Truncate fraction if it is not an integer
    fraction = parseInt(fraction, 10);

    // Compute integer part
    var result = parseInt(dollar, 10);

    // Add decimal part
    result += (dollar % 1) * Math.pow(10, -Math.ceil(Math.log(fraction) / Math.LN10)) * fraction;

    // Return converted dollar price
    return result;
  };

  Formula.DURATION = function () {
    return;
  };

  Formula.EFFECT = function (rate, periods) {
    // Return error if any of the parameters is not a number
    if (isNaN(rate) || isNaN(periods)) {
      return '#VALUE!';
    }

    // Return error if rate <=0 or periods < 1
    if (rate <= 0 || periods < 1) {
      return '#NUM!';
    }

    // Truncate periods if it is not an integer
    periods = parseInt(periods, 10);

    // Return effective annual interest rate
    return Math.pow(1 + rate / periods, periods) - 1;
  };

  Formula.FV = function (rate, periods, payment, value, type) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Initialize type
    type = (typeof type === 'undefined') ? 0 : type;

    // Evaluate rate (TODO: replace with secure expression evaluator)
    rate = eval(rate);

    // Return future value
    var result;
    if (rate === 0) {
      result = value + payment * periods;
    } else {
      var term = Math.pow(1 + rate, periods);
      if (type === 1) {
        result = value * term + payment * (1 + rate) * (term - 1.0) / rate;
      } else {
        result = value * term + payment * (term - 1) / rate;
      }
    }
    return -result;
  };

  Formula.FVSCHEDULE = function (principal, schedule) {
    // Initialize future value
    var future = principal;

    // Apply all interests in schedule
    for (var i = 0; i < schedule.length; i++) {
      // Return error if schedule value is not a number
      if (isNaN(schedule[i])) {
        return '#VALUE!';
      }

      // Apply scheduled interest
      future *= 1 + schedule[i];
    }

    // Return future value
    return future;
  };

  Formula.INTRATE = function () {
    return;
  };

  Formula.IPMT = function (rate, period, periods, present, future, type) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Initialize type
    type = (typeof type === 'undefined') ? 0 : type;

    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);
    periods = eval(periods);

    // Compute payment
    var payment = Formula.PMT(rate, periods, present, future, type);

    // Compute interest
    var interest;
    if (period === 1) {
      if (type === 1) {
        interest = 0;
      } else {
        interest = -present;
      }
    } else {
      if (type === 1) {
        interest = Formula.FV(rate, period - 2, payment, present, 1) - payment;
      } else {
        interest = Formula.FV(rate, period - 1, payment, present, 0);
      }
    }

    // Return interest
    return interest * rate;
  };

  Formula.IRR = function (values, guess) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Calculates the resulting amount
    var irrResult = function (values, dates, rate) {
      var r = rate + 1;
      var result = values[0];
      for (var i = 1; i < values.length; i++) {
        result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
      }
      return result;
    };

    // Calculates the first derivation
    var irrResultDeriv = function (values, dates, rate) {
      var r = rate + 1;
      var result = 0;
      for (var i = 1; i < values.length; i++) {
        var frac = (dates[i] - dates[0]) / 365;
        result -= frac * values[i] / Math.pow(r, frac + 1);
      }
      return result;
    };

    // Initialize dates and check that values contains at least one positive value and one negative value
    var dates = [];
    var positive = false;
    var negative = false;
    for (var i = 0; i < values.length; i++) {
      dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
      if (values[i] > 0) {
        positive = true;
      }
      if (values[i] < 0) {
        negative = true;
      }
    }

    // Return error if values does not contain at least one positive value and one negative value
    if (!positive || !negative) {
      return '#NUM!';
    }

    // Initialize guess and resultRate
    guess = (typeof guess === 'undefined') ? 0.1 : guess;
    var resultRate = guess;

    // Set maximum epsilon for end of iteration
    var epsMax = 1e-10;

    // Set maximum number of iterations
    var iterMax = 50;

    // Implement Newton's method
    var newRate, epsRate, resultValue;
    var iteration = 0;
    var contLoop = true;
    do {
      resultValue = irrResult(values, dates, resultRate);
      newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
      epsRate = Math.abs(newRate - resultRate);
      resultRate = newRate;
      contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
    } while (contLoop && (++iteration < iterMax));

    if (contLoop) {
      return '#NUM!';
    }

    // Return internal rate of return
    return resultRate;
  };

  Formula.ISPMT = function (rate, period, periods, value) {
    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);
    periods = eval(periods);

    // Return interest
    return value * rate * (period / periods - 1);
  };

  Formula.MDURATION = function () {
    return;
  };

  Formula.MIRR = function (values, finance_rate, reinvest_rate) {
    // Initialize number of values
    var n = values.length;

    // Lookup payments (negative values) and incomes (positive values)
    var payments = [];
    var incomes = [];
    for (var i = 0; i < n; i++) {
      if (values[i] < 0) {
        payments.push(values[i]);
      } else {
        incomes.push(values[i]);
      }
    }

    // Return modified internal rate of return
    var num = -Formula.NPV(reinvest_rate, incomes) * Math.pow(1 + reinvest_rate, n - 1);
    var den = Formula.NPV(finance_rate, payments) * (1 + finance_rate);
    return Math.pow(num / den, 1 / (n - 1)) - 1;
  };

  Formula.NOMINAL = function (rate, periods) {
    // Return error if any of the parameters is not a number
    if (isNaN(rate) || isNaN(periods)) {
      return '#VALUE!';
    }

    // Return error if rate <=0 or periods < 1
    if (rate <= 0 || periods < 1) {
      return '#NUM!';
    }

    // Truncate periods if it is not an integer
    periods = parseInt(periods, 10);

    // Return nominal annual interest rate
    return (Math.pow(rate + 1, 1 / periods) - 1) * periods;
  };

  Formula.NPER = function (rate, payment, present, future, type) {
    // Initialize type
    type = (typeof type === 'undefined') ? 0 : type;

    // Initialize future value
    future = (typeof future === 'undefined') ? 0 : future;

    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);

    // Return number of periods
    var num = payment * (1 + rate * type) - future * rate;
    var den = (present * rate + payment * (1 + rate * type));
    return Math.log(num / den) / Math.log(1 + rate);
  };

  Formula.NPV = function () {
    // Cast arguments to array
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args = args.concat(arguments[i]);
    }

    // Lookup rate
    var rate = args[0];

    // Initialize net present value
    var value = 0;

    // Loop on all values
    for (var j = 1; j < args.length; j++) {
      value += args[j] / Math.pow(1 + rate, j);
    }

    // Return net present value
    return value;
  };

  Formula.ODDFPRICE = function () {
    return;
  };

  Formula.ODDFYIELD = function () {
    return;
  };

  Formula.ODDLPRICE = function () {
    return;
  };

  Formula.ODDLYIELD = function () {
    return;
  };

  Formula.PDURATION = function (rate, present, future) {
    // Return error if any of the parameters is not a number
    if (isNaN(rate) || isNaN(present) || isNaN(future)) {
      return '#VALUE!';
    }

    // Return error if rate <=0
    if (rate <= 0) {
      return '#NUM!';
    }

    // Return number of periods
    return (Math.log(future) - Math.log(present)) / Math.log(1 + rate);
  };

  Formula.PMT = function (rate, periods, present, future, type) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Initialize type
    type = (typeof type === 'undefined') ? 0 : type;

    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);
    periods = eval(periods);

    // Return payment
    var result;
    if (rate === 0) {
      result = (present + future) / periods;
    } else {
      var term = Math.pow(1 + rate, periods);
      if (type === 1) {
        result = (future * rate / (term - 1) + present * rate / (1 - 1 / term)) / (1 + rate);
      } else {
        result = future * rate / (term - 1) + present * rate / (1 - 1 / term);
      }
    }
    return -result;
  };

  Formula.PPMT = function (rate, period, periods, present, future, type) {
    return Formula.PMT(rate, periods, present, future, type) - Formula.IPMT(rate, period, periods, present, future, type);
  };

  Formula.PRICE = function () {
    return;
  };

  Formula.PRICEDISC = function () {
    return;
  };

  Formula.PRICEMAT = function () {
    return;
  };

  Formula.PV = function (rate, periods, payment, future, type) {
    // Initialize type
    type = (typeof type === 'undefined') ? 0 : type;

    // Evaluate rate and periods (TODO: replace with secure expression evaluator)
    rate = eval(rate);
    periods = eval(periods);

    // Return present value
    if (rate === 0) {
      return -payment * periods - future;
    } else {
      return (((1 - Math.pow(1 + rate, periods)) / rate) * payment * (1 + rate * type) - future) / Math.pow(1 + rate, periods);
    }
  };

  Formula.RATE = function (periods, payment, present, future, type, guess) {
    // Credits: rabugento

    // Initialize guess
    guess = (typeof guess === 'undefined') ? 0.01 : guess;

    // Initialize future
    future = (typeof future === 'undefined') ? 0 : future;

    // Initialize type
    type = (typeof type === 'undefined') ? 0 : type;

    // Evaluate periods (TODO: replace with secure expression evaluator)
    periods = eval(periods);

    // Set maximum epsilon for end of iteration
    var epsMax = 1e-10;

    // Set maximum number of iterations
    var iterMax = 50;

    // Implement Newton's method
    var y, y0, y1, x0, x1 = 0, f = 0, i = 0;
    var rate = guess;
    if (Math.abs(rate) < epsMax) {
      y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
    } else {
      f = Math.exp(periods * Math.log(1 + rate));
      y = present * f + payment * (1 / rate + type) * (f - 1) + future;
    }
    y0 = present + payment * periods + future;
    y1 = present * f + payment * (1 / rate + type) * (f - 1) + future;
    i = x0 = 0;
    x1 = rate;
    while ((Math.abs(y0 - y1) > epsMax) && (i < iterMax)) {
      rate = (y1 * x0 - y0 * x1) / (y1 - y0);
      x0 = x1;
      x1 = rate;
      if (Math.abs(rate) < epsMax) {
        y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
      } else {
        f = Math.exp(periods * Math.log(1 + rate));
        y = present * f + payment * (1 / rate + type) * (f - 1) + future;
      }
      y0 = y1;
      y1 = y;
      ++i;
    }
    return rate;
  };

  Formula.RECEIVED = function () {
    return;
  };

  Formula.RRI = function (periods, present, future) {
    // Return error if any of the parameters is not a number
    if (isNaN(periods) || isNaN(present) || isNaN(future)) {
      return '#VALUE!';
    }

    // Return error if periods or present is equal to 0 (zero)
    if (periods === 0 || present === 0) {
      return '#NUM!';
    }

    // Return equivalent interest rate
    return Math.pow(future / present, 1 / periods) - 1;
  };

  Formula.SLN = function (cost, salvage, life) {
    // Return error if any of the parameters is not a number
    if (isNaN(cost) || isNaN(salvage) || isNaN(life)) {
      return '#VALUE!';
    }

    // Return error if life equal to 0 (zero)
    if (life === 0) {
      return '#NUM!';
    }

    // Return straight-line depreciation
    return (cost - salvage) / life;
  };

  Formula.SYD = function (cost, salvage, life, period) {
    // Return error if any of the parameters is not a number
    if (isNaN(cost) || isNaN(salvage) || isNaN(life) || isNaN(period)) {
      return '#VALUE!';
    }

    // Return error if life equal to 0 (zero)
    if (life === 0) {
      return '#NUM!';
    }

    // Return error if period is lower than 1 or greater than life
    if (period < 1 || period > life) {
      return '#NUM!';
    }

    // Truncate period if it is not an integer
    period = parseInt(period, 10);

    // Return straight-line depreciation
    return (cost - salvage) * (life - period + 1) * 2 / (life * (life + 1));
  };

  Formula.TBILLEQ = function (settlement, maturity, discount) {
    // Return error if either date is invalid
    if (!moment(settlement).isValid() || !moment(maturity).isValid()) {
      return '#VALUE!';
    }

    // Return error if discount is lower than or equal to zero
    if (discount <= 0) {
      return '#NUM!';
    }

    // Return error if settlement is greater than maturity
    if (moment(settlement).diff(moment(maturity)) > 0) {
      return '#NUM!';
    }

    // Return error if maturity is more than one year after settlement
    if (moment(maturity).diff(moment(settlement), 'years') > 1) {
      return '#NUM!';
    }

    // Return bond-equivalent yield
    return (365 * discount) / (360 - discount * Formula.DAYS360(settlement, maturity));
  };

  Formula.TBILLPRICE = function (settlement, maturity, discount) {
    // Return error if either date is invalid
    if (!moment(settlement).isValid() || !moment(maturity).isValid()) {
      return '#VALUE!';
    }

    // Return error if discount is lower than or equal to zero
    if (discount <= 0) {
      return '#NUM!';
    }

    // Return error if settlement is greater than maturity
    if (moment(settlement).diff(moment(maturity)) > 0) {
      return '#NUM!';
    }

    // Return error if maturity is more than one year after settlement
    if (moment(maturity).diff(moment(settlement), 'years') > 1) {
      return '#NUM!';
    }

    // Return bond-equivalent yield
    return 100 * (1 - discount * Formula.DAYS360(settlement, maturity) / 360);
  };

  Formula.TBILLYIELD = function (settlement, maturity, price) {
    // Return error if either date is invalid
    if (!moment(settlement).isValid() || !moment(maturity).isValid()) {
      return '#VALUE!';
    }

    // Return error if price is lower than or equal to zero
    if (price <= 0) {
      return '#NUM!';
    }

    // Return error if settlement is greater than maturity
    if (moment(settlement).diff(moment(maturity)) > 0) {
      return '#NUM!';
    }

    // Return error if maturity is more than one year after settlement
    if (moment(maturity).diff(moment(settlement), 'years') > 1) {
      return '#NUM!';
    }

    // Return bond-equivalent yield
    return (100 - price) * 360 / (price * Formula.DAYS360(settlement, maturity));
  };

  Formula.VDB = function () {
    return;
  };


  Formula.XIRR = function (values, dates, guess) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Calculates the resulting amount
    var irrResult = function (values, dates, rate) {
      var r = rate + 1;
      var result = values[0];
      for (var i = 1; i < values.length; i++) {
        result += values[i] / Math.pow(r, moment(dates[i]).diff(moment(dates[0]), 'days') / 365);
      }
      return result;
    };

    // Calculates the first derivation
    var irrResultDeriv = function (values, dates, rate) {
      var r = rate + 1;
      var result = 0;
      for (var i = 1; i < values.length; i++) {
        var frac = moment(dates[i]).diff(moment(dates[0]), 'days') / 365;
        result -= frac * values[i] / Math.pow(r, frac + 1);
      }
      return result;
    };

    // Check that values contains at least one positive value and one negative value
    var positive = false;
    var negative = false;
    for (var i = 0; i < values.length; i++) {
      if (values[i] > 0) {
        positive = true;
      }
      if (values[i] < 0) {
        negative = true;
      }
    }

    // Return error if values does not contain at least one positive value and one negative value
    if (!positive || !negative) {
      return '#NUM!';
    }

    // Initialize guess and resultRate
    guess = guess || 0.1;
    var resultRate = guess;

    // Set maximum epsilon for end of iteration
    var epsMax = 1e-10;

    // Set maximum number of iterations
    var iterMax = 50;

    // Implement Newton's method
    var newRate, epsRate, resultValue;
    var iteration = 0;
    var contLoop = true;
    do {
      resultValue = irrResult(values, dates, resultRate);
      newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
      epsRate = Math.abs(newRate - resultRate);
      resultRate = newRate;
      contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
    } while (contLoop && (++iteration < iterMax));

    if (contLoop) {
      return '#NUM!';
    }

    // Return internal rate of return
    return resultRate;
  };

  Formula.XNPV = function (rate, values, dates) {
    var result = 0;
    for (var i = 0; i < values.length; i++) {
      result += values[i] / Math.pow(1 + rate, moment(dates[i]).diff(moment(dates[0]), 'days') / 365);
    }
    return result;
  };

  Formula.YIELD = function () {
    return;
  };

  Formula.YIELDDISC = function () {
    return;
  };

  Formula.YIELDMAT = function () {
  };


  // Information functions

  Formula.ISNUMBER = function (number) {
    return (!isNaN(parseFloat(number)) && isFinite(number)) ? true : false;
  };


  // Logical functions

  Formula.AND = function () {
    var result = true;
    for (var i = 0; i < arguments.length; i++) {
      if (!arguments[i]) {
        result = false;
      }
    }
    return result;
  };

  Formula.FALSE = function () {
    return false;
  };

  Formula.IF = function (test, then_value, otherwise_value) {
    if (test) {
      return (typeof then_value === 'undefined') ? true : then_value;
    } else {
      return (typeof otherwise_value === 'undefined') ? true : otherwise_value;
    }
  };

  Formula.IFERROR = function (value, value_if_error) {
    return (['#DIV/0!', '#N/A', '#NAME?', '#NUM!', '#NULL!', '#REF!', '#VALUE!'].indexOf(value) >= 0 ) ? value_if_error : value;
  };

  Formula.IFNA = function (value, value_if_na) {
    return (value === '#N/A') ? value_if_na : value;
  };

  Formula.NOT = function (logical) {
    return !logical;
  };

  Formula.OR = function () {
    var result = false;
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]) {
        result = true;
      }
    }
    return result;
  };

  Formula.TRUE = function () {
    return true;
  };

  Formula.XOR = function () {
    var result = 0;
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]) {
        result++;
      }
    }
    return (Math.floor(Math.abs(result)) & 1) ? true : false;
  };


  // Lookup and reference functions

  Formula.REFERENCE = function (context, reference) {
    try {
      var path = reference.split('.'),
        result = context;
      _(path).forEach(function (step) {
        if (step[step.length - 1] === ']') {
          var opening = step.indexOf('[');
          var index = step.substring(opening + 1, step.length - 1);
          result = result[step.substring(0, opening)][index];
        } else {
          result = result[step];
        }
      });
      return result;
    } catch (error) {
      return;
    }
  };


  // Math functions

  Formula.ABS = function (number) {
    return Math.abs(number);
  };

  Formula.ACOS = function (number) {
    return Math.acos(number);
  };

  Formula.ACOSH = function (number) {
    return Math.log(number + Math.sqrt(number * number - 1));
  };

  Formula.ACOT = function (number) {
    return Math.atan(1 / number);
  };

  Formula.ACOTH = function (number) {
    return 0.5 * Math.log((number + 1) / (number - 1));
  };

  Formula.AGGREGATE = function (function_code, options) {
    var result = [];
    for (var i = 2; i < arguments.length; i++) {
      switch (function_code) {
        case 1:
          result[i - 2] = Formula.AVERAGE(arguments[i]);
          break;
        case 2:
          result[i - 2] = Formula.COUNT(arguments[i]);
          break;
        case 3:
          result[i - 2] = Formula.COUNTA(arguments[i]);
          break;
        case 4:
          result[i - 2] = Formula.MAX(arguments[i]);
          break;
        case 5:
          result[i - 2] = Formula.MIN(arguments[i]);
          break;
        case 6:
          result[i - 2] = Formula.PRODUCT(arguments[i]);
          break;
        case 7:
          result[i - 2] = Formula.STDEVS(arguments[i]);
          break;
        case 8:
          result[i - 2] = Formula.STDEVP(arguments[i]);
          break;
        case 9:
          result[i - 2] = Formula.SUM(arguments[i]);
          break;
        case 10:
          result[i - 2] = Formula.VARS(arguments[i]);
          break;
        case 11:
          result[i - 2] = Formula.VARP(arguments[i]);
          break;
        case 12:
          result[i - 2] = Formula.MEDIAN(arguments[i]);
          break;
        case 13:
          result[i - 2] = Formula.MODESNGL(arguments[i]);
          break;
        case 14:
          result[i - 2] = Formula.LARGE(arguments[i]);
          break;
        case 15:
          result[i - 2] = Formula.SMALL(arguments[i]);
          break;
        case 16:
          result[i - 2] = Formula.PERCENTILEINC(arguments[i]);
          break;
        case 17:
          result[i - 2] = Formula.QUARTILEINC(arguments[i]);
          break;
        case 18:
          result[i - 2] = Formula.PERCENTILEEXC(arguments[i]);
          break;
        case 19:
          result[i - 2] = Formula.QUARTILEEXC(arguments[i]);
          break;
      }
    }
    return result;
  };

  Formula.ARABIC = function (text) {
    // Credits: Rafa? Kukawski
    if (!/^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/.test(text)) {
      throw new Error('Incorrect roman number');
    }
    var r = 0;
    text.replace(/[MDLV]|C[MD]?|X[CL]?|I[XV]?/g, function (i) {
      r += {M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1}[i];
    });
    return r;
  };

  Formula.ASIN = function (number) {
    return Math.asin(number);
  };

  Formula.ASINH = function (number) {
    return Math.log(number + Math.sqrt(number * number + 1));
  };

  Formula.ATAN = function (number) {
    return Math.atan(number);
  };

  Formula.ATAN2 = function (number_x, number_y) {
    return Math.atan2(number_x, number_y);
  };

  Formula.ATANH = function (number) {
    return Math.log((1 + number) / (1 - number)) / 2;
  };

  Formula.BASE = function (number, radix, min_length) {
    min_length = (typeof min_length === 'undefined') ? 0 : min_length;
    var result = number.toString(radix);
    return new Array(Math.max(min_length + 1 - result.length, 0)).join('0') + result;
  };

  Formula.CEILING = function (number, significance, mode) {
    if (significance === 0) {
      return 0;
    }
    significance = (typeof significance === 'undefined') ? 1 : Math.abs(significance);
    mode = (typeof mode === 'undefined') ? 0 : mode;
    var precision = -Math.floor(Math.log(significance) / Math.log(10));
    if (number >= 0) {
      return Formula.ROUND(Math.ceil(number / significance) * significance, precision);
    } else {
      if (mode === 0) {
        return -Formula.ROUND(Math.floor(Math.abs(number) / significance) * significance, precision);
      } else {
        return -Formula.ROUND(Math.ceil(Math.abs(number) / significance) * significance, precision);
      }
    }
  };

  Formula.CEILINGMATH = Formula.CEILING;

  Formula.CEILINGPRECISE = Formula.CEILING;

  Formula.COMBIN = function (number, number_chosen) {
    return Formula.FACT(number) / (Formula.FACT(number_chosen) * Formula.FACT(number - number_chosen));
  };

  Formula.COMBINA = function (number, number_chosen) {
    return (number === 0 && number_chosen === 0) ? 1 : Formula.COMBIN(number + number_chosen - 1, number - 1);
  };

  Formula.COS = function (number) {
    return Math.cos(number);
  };

  Formula.COSH = function (number) {
    return (Math.exp(number) + Math.exp(-number)) / 2;
  };

  Formula.COT = function (number) {
    return 1 / Math.tan(number);
  };

  Formula.COTH = function (number) {
    var e2 = Math.exp(2 * number);
    return (e2 + 1) / (e2 - 1);
  };

  Formula.CSC = function (number) {
    return 1 / Math.sin(number);
  };

  Formula.CSCH = function (number) {
    return 2 / (Math.exp(number) - Math.exp(-number));
  };

  Formula.DECIMAL = function (number, radix) {
    return parseInt(number, radix);
  };

  Formula.DEGREES = function (number) {
    return number * 180 / Math.PI;
  };

  Formula.EVEN = function (number) {
    return Formula.CEILING(number, -2, -1);
  };

  Formula.EXP = function (number) {
    return Math.exp(number);
  };

  Formula.FACT = function (number) {
    var n = Math.floor(number);
    if (n === 0 || n === 1) {
      return 1;
    } else if (MEMOIZED_FACT[n] > 0) {
      return MEMOIZED_FACT[n];
    } else {
      MEMOIZED_FACT[n] = Formula.FACT(n - 1) * n;
      return MEMOIZED_FACT[n];
    }
  };

  Formula.FACTDOUBLE = function (number) {
    var n = Math.floor(number);
    if (n <= 0) {
      return 1;
    } else {
      return n * Formula.FACTDOUBLE(n - 2);
    }
  };

  Formula.FLOOR = function (number, significance, mode) {
    if (significance === 0) {
      return 0;
    }
    significance = (typeof significance === 'undefined') ? 1 : Math.abs(significance);
    mode = (typeof mode === 'undefined') ? 0 : mode;
    var precision = -Math.floor(Math.log(significance) / Math.log(10));
    if (number >= 0) {
      return Formula.ROUND(Math.floor(number / significance) * significance, precision);
    } else {
      if (mode === 0) {
        return -Formula.ROUND(Math.ceil(Math.abs(number) / significance) * significance, precision);
      } else {
        return -Formula.ROUND(Math.floor(Math.abs(number) / significance) * significance, precision);
      }
    }
  };

  Formula.FLOORMATH = Formula.FLOOR;

  Formula.FLOORPRECISE = Formula.FLOOR;

  Formula.GCD = function () {
    // Credits: Andrew Pociu
    for (var r, a, i = arguments.length - 1, result = arguments[i]; i;) {
      for (a = arguments[--i]; (r = a % result); a = result, result = r) {
        //empty
      }
    }
    return result;
  };

  Formula.INT = function (number) {
    return Math.floor(number);
  };

  Formula.ISEVEN = function (number) {
    return (Math.floor(Math.abs(number)) & 1) ? false : true;
  };

  Formula.ISOCEILING = Formula.CEILING;

  Formula.ISODD = function (number) {
    return (Math.floor(Math.abs(number)) & 1) ? true : false;
  };

  Formula.LCM = function () {
    // Credits: Jonas Raoni Soares Silva
    var o = Formula.ARGSTOARRAY(arguments);
    for (var i, j, n, d, r = 1; (n = o.pop()) !== undefined;) {
      while (n > 1) {
        if (n % 2) {
          for (i = 3, j = Math.floor(Math.sqrt(n)); i <= j && n % i; i += 2) {
            //empty
          }
          d = (i <= j) ? i : n;
        } else {
          d = 2;
        }
        for (n /= d, r *= d, i = o.length; i; (o[--i] % d) === 0 && (o[i] /= d) === 1 && o.splice(i, 1)) {
          //empty
        }
      }
    }
    return r;
  };

  Formula.LN = function (number) {
    return Math.log(number);
  };

  Formula.LOG = function (number, base) {
    base = (typeof base === 'undefined') ? 10 : base;
    return Math.log(number) / Math.log(base);
  };

  Formula.LOG10 = function (number) {
    return Math.log(number) / Math.log(10);
  };

  Formula.MDETERM = numeric.det;

  Formula.MINVERSE = numeric.inv;

  Formula.MMULT = numeric.dot;

  Formula.MOD = function (dividend, divisor) {
    var modulus = Math.abs(dividend % divisor);
    return (divisor > 0) ? modulus : -modulus;
  };

  Formula.MROUND = function (number, multiple) {
    if (number * multiple < 0) {
      throw new Error('Number and multiple must have the same sign.');
    }

    return Math.round(number / multiple) * multiple;
  };

  Formula.MULTINOMIAL = function () {
    var sum = 0;
    var divisor = 1;
    for (var i = 0; i < arguments.length; i++) {
      sum += arguments[i];
      divisor *= Formula.FACT(arguments[i]);
    }
    return Formula.FACT(sum) / divisor;
  };

  Formula.MUNIT = numeric.identity;

  Formula.ODD = function (number) {
    var temp = Math.ceil(Math.abs(number));
    temp = (temp & 1) ? temp : temp + 1;
    return (number > 0) ? temp : -temp;
  };

  Formula.PI = function () {
    return Math.PI;
  };

  Formula.POWER = function (number, power) {
    return Math.pow(number, power);
  };

  Formula.PRODUCT = function () {
    var result = 1;
    for (var i = 0; i < arguments.length; i++) {
      result *= arguments[i];
    }
    return result;
  };

  Formula.QUOTIENT = function (numerator, denominator) {
    return (numerator / denominator).toFixed(0);
  };

  Formula.RADIANS = function (number) {
    return number * Math.PI / 180;
  };

  Formula.RAND = function () {
    return Math.random();
  };

  Formula.RANDBETWEEN = function (bottom, top) {
    // Creative Commons Attribution 3.0 License
    // Copyright (c) 2012 eqcode
    return bottom + Math.ceil((top - bottom + 1) * Math.random()) - 1;
  };

  Formula.ROUND = function (number, digits) {
    return Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);
  };

  Formula.ROUNDDOWN = function (number, digits) {
    var sign = (number > 0) ? 1 : -1;
    return sign * (Math.floor(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
  };

  Formula.ROUNDUP = function (number, digits) {
    var sign = (number > 0) ? 1 : -1;
    return sign * (Math.ceil(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
  };

  Formula.SERIESSUM = function (x, n, m, coefficients) {
    var result = coefficients[0] * Math.pow(x, n);
    for (var i = 1; i < coefficients.length; i++) {
      result += coefficients[i] * Math.pow(x, n + i * m);
    }
    return result;
  };

  Formula.SEC = function (number) {
    return 1 / Math.cos(number);
  };

  Formula.SECH = function (number) {
    return 2 / (Math.exp(number) + Math.exp(-number));
  };

  Formula.SIGN = function (number) {
    if (number < 0) {
      return -1;
    } else if (number === 0) {
      return 0;
    } else {
      return 1;
    }
  };

  Formula.SIN = function (number) {
    return Math.sin(number);
  };

  Formula.SINH = function (number) {
    return (Math.exp(number) - Math.exp(-number)) / 2;
  };

  Formula.SQRT = function (number) {
    return Math.sqrt(number);
  };

  Formula.SQRTPI = function (number) {
    return Math.sqrt(number * Math.PI);
  };

  Formula.SUBTOTAL = function (function_code) {
    var result = [];
    for (var i = 1; i < arguments.length; i++) {
      switch (function_code) {
        case 1:
          result[i - 1] = Formula.AVERAGE(arguments[i]);
          break;
        case 2:
          result[i - 1] = Formula.COUNT(arguments[i]);
          break;
        case 3:
          result[i - 1] = Formula.COUNTA(arguments[i]);
          break;
        case 4:
          result[i - 1] = Formula.MAX(arguments[i]);
          break;
        case 5:
          result[i - 1] = Formula.MIN(arguments[i]);
          break;
        case 6:
          result[i - 1] = Formula.PRODUCT(arguments[i]);
          break;
        case 7:
          result[i - 1] = Formula.STDEV(arguments[i]);
          break;
        case 8:
          result[i - 1] = Formula.STDEVP(arguments[i]);
          break;
        case 9:
          result[i - 1] = Formula.SUM(arguments[i]);
          break;
        case 10:
          result[i - 1] = Formula.VAR(arguments[i]);
          break;
        case 11:
          result[i - 1] = Formula.VARP(arguments[i]);
          break;
      }
    }
    return result;
  };

  Formula.SUM = function () {
    var numbers = Formula.ARGSTOARRAY(arguments);
    var result = 0;
    for (var i = 0; i < numbers.length; i++) {
      if (numbers[i] instanceof Array) {
        for (var j = 0; j < numbers[i].length; j++) {
          result += (Formula.ISNUMBER(numbers[i][j])) ? numbers[i][j] : 0;
        }
      } else {
        result += (Formula.ISNUMBER(numbers[i])) ? numbers[i] : 0;
      }
    }
    return result;
  };

  Formula.SUMIF = function (range, criteria) {
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      result += (eval(range[i] + criteria)) ? range[i] : 0;
    }
    return result;
  };

  Formula.SUMIFS = function () {
    var criteria = (arguments.length - 1) / 2;
    var range = arguments[0];
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      var fit = true;
      for (var j = 0; j < criteria; j++) {
        if (!eval(arguments[2 * j + 1][i] + arguments[2 * j + 2])) {
          fit = false;
        }
      }
      result += (fit) ? range[i] : 0;
    }
    return result;
  };

  Formula.SUMPRODUCT = function () {
    var arrays = arguments.length + 1;
    var result = 0;
    for (var i = 0; i < arguments[0].length; i++) {
      for (var j = 0; j < arguments[0][i].length; j++) {
        var product = 1;
        for (var k = 1; k < arrays; k++) {
          product *= arguments[k - 1][i][j];
        }
        result += product;
      }
    }
    return result;
  };

  Formula.SUMSQ = function () {
    var numbers = Formula.ARGSTOARRAY(arguments);
    var result = 0;
    for (var i = 0; i < numbers.length; i++) {
      result += (Formula.ISNUMBER(numbers[i])) ? numbers[i] * numbers[i] : 0;
    }
    return result;
  };

  Formula.SUMX2MY2 = function (array_x, array_y) {
    var result = 0;
    for (var i = 0; i < array_x.length; i++) {
      result += array_x[i] * array_x[i] - array_y[i] * array_y[i];
    }
    return result;
  };

  Formula.SUMX2PY2 = function (array_x, array_y) {
    var result = 0;
    for (var i = 0; i < array_x.length; i++) {
      result += array_x[i] * array_x[i] + array_y[i] * array_y[i];
    }
    return result;
  };

  Formula.SUMXMY2 = function (array_x, array_y) {
    var result = 0;
    for (var i = 0; i < array_x.length; i++) {
      result += Math.pow(array_x[i] - array_y[i], 2);
    }
    return result;
  };

  Formula.TAN = function (number) {
    return Math.tan(number);
  };

  Formula.TANH = function (number) {
    var e2 = Math.exp(2 * number);
    return (e2 - 1) / (e2 + 1);
  };

  Formula.TRUNC = function (number, digits) {
    digits = (typeof digits === 'undefined') ? 0 : digits;
    var sign = (number > 0) ? 1 : -1;
    return sign * (Math.floor(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
  };


  // Statistical functions
  Formula.AVEDEV = function () {
    var range = Formula.ARGSCONCAT(arguments);
    return jStat.sum(jStat(range).subtract(jStat.mean(range)).abs()[0]) / range.length;
  };

  Formula.AVERAGE = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var count = 0;
    var sigma = 0;
    for (var i = 0; i < n; i++) {
      if (range[i] !== true && range[i] !== false) {
        sigma += range[i];
        count++;
      }
    }
    return sigma / count;
  };

  Formula.AVERAGEA = function () {
    return jStat.mean(Formula.ARGSCONCAT(arguments));
  };

  Formula.AVERAGEIF = function (range, criteria, average_range) {
    average_range = (typeof average_range === 'undefined') ? range : average_range;
    var average_count = 0;
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      if (eval(range[i] + criteria)) {
        result += average_range[i];
        average_count++;
      }
    }
    return result / average_count;
  };

  Formula.AVERAGEIFS = function () {
    var criteria = (arguments.length - 1) / 2;
    var range = arguments[0];
    var count = 0;
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      var fit = true;
      for (var j = 0; j < criteria; j++) {
        if (!eval(arguments[2 * j + 1][i] + arguments[2 * j + 2])) {
          fit = false;
        }
      }
      if (fit) {
        result += range[i];
        count++;
      }
    }
    return result / count;
  };

  Formula.BETADIST = function (x, alpha, beta, cumulative, A, B) {
    A = (typeof A === 'undefined') ? 0 : A;
    B = (typeof B === 'undefined') ? 1 : B;
    x = (x - A) / (B - A);
    return (cumulative) ? jStat.beta.cdf(x, alpha, beta) : jStat.beta.pdf(x, alpha, beta);
  };

  Formula.BETAINV = function (probability, alpha, beta, A, B) {
    A = (typeof A === 'undefined') ? 0 : A;
    B = (typeof B === 'undefined') ? 1 : B;
    return jStat.beta.inv(probability, alpha, beta) * (B - A) + A;
  };

  Formula.BINOMDIST = function (successes, trials, probability, cumulative) {
    return (cumulative) ? jStat.binomial.cdf(successes, trials, probability) : jStat.binomial.pdf(successes, trials, probability);
  };

  Formula.BINOMDISTRANGE = function (trials, probability, successes, successes2) {
    successes2 = (typeof successes2 === 'undefined') ? successes : successes2;
    var result = 0;
    for (var i = successes; i <= successes2; i++) {
      result += Formula.COMBIN(trials, i) * Math.pow(probability, i) * Math.pow(1 - probability, trials - i);
    }
    return result;
  };

  Formula.BINOMINV = function (trials, probability, alpha) {
    var x = 0;
    while (x <= trials) {
      if (jStat.binomial.cdf(x, trials, probability) >= alpha) {
        return x;
      }
      x++;
    }
  };

  Formula.CHISQDIST = function (x, k, cumulative) {
    return (cumulative) ? jStat.chisquare.cdf(x, k) : jStat.chisquare.pdf(x, k);
  };

  Formula.CHISQDISTRT = function (x, k) {
    return;
  };

  Formula.CHISQINV = function (probability, k) {
    return jStat.chisquare.inv(probability, k);
  };

  Formula.CHISQINVRT = function () {
    return;
  };

  Formula.CHISQTEST = function () {
    return;
  };

  Formula.CONFIDENCENORM = function (alpha, sd, n) {
    return jStat.normalci(1, alpha, sd, n)[1] - 1;
  };

  Formula.CONFIDENCET = function (alpha, sd, n) {
    return jStat.tci(1, alpha, sd, n)[1] - 1;
  };

  Formula.CORREL = function () {
    return jStat.corrcoeff.apply(this, arguments);
  };

  Formula.COUNT = function () {
    return Formula.ARGSCONCAT(arguments).length;
  };

  Formula.COUNTA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    return range.length - Formula.COUNTBLANK(range);
  };

  Formula.COUNTBLANK = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var blanks = 0;
    for (var i = 0; i < range.length; i++) {
      if (range[i] === null || range[i] === '') {
        blanks++;
      }
    }
    return blanks;
  };

  Formula.COUNTIF = function (range, criteria) {
    var matches = 0;
    for (var i = 0; i < range.length; i++) {
      if (range[i].match(new RegExp(criteria))) {
        matches++;
      }
    }
    return matches;
  };

  Formula.COUNTIFS = function () {
    var criteria = (arguments.length - 1) / 2;
    var range = arguments[0];
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      var fit = true;
      for (var j = 0; j < criteria; j++) {
        if (!eval(arguments[2 * j + 1][i] + arguments[2 * j + 2])) {
          fit = false;
        }
      }
      result += (fit) ? 1 : 0;
    }
    return result;
  };

  Formula.COUNTUNIQUE = function () {
    return _.uniq(Formula.ARGSCONCAT(arguments)).length;
  };

  Formula.COVARIANCEP = function (array1, array2) {
    var mean1 = jStat.mean(array1);
    var mean2 = jStat.mean(array2);
    var result = 0;
    var n = array1.length;
    for (var i = 0; i < n; i++) {
      result += (array1[i] - mean1) * (array2[i] - mean2);
    }
    return result / n;
  };

  Formula.COVARIANCES = function () {
    return jStat.covariance.apply(this, arguments);
  };

  Formula.DEVSQ = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var mean = jStat.mean(range);
    var result = 0;
    for (var i = 0; i < range.length; i++) {
      result += Math.pow((range[i] - mean), 2);
    }
    return result;
  };

  Formula.EXPONDIST = function (x, lambda, cumulative) {
    return (cumulative) ? jStat.exponential.cdf(x, lambda) : jStat.exponential.pdf(x, lambda);
  };

  Formula.FDIST = function (x, d1, d2, cumulative) {
    return (cumulative) ? jStat.centralF.cdf(x, d1, d2) : jStat.centralF.pdf(x, d1, d2);
  };

  Formula.FDISTRT = function () {
    return;
  };

  Formula.FINV = function (probability, d1, d2) {
    return jStat.centralF.inv(probability, d1, d2);
  };

  Formula.FINVRT = function () {
    return;
  };

  Formula.FTEST = function () {
    return;
  };

  Formula.FISHER = function (x) {
    return Math.log((1 + x) / (1 - x)) / 2;
  };

  Formula.FISHERINV = function (y) {
    var e2y = Math.exp(2 * y);
    return (e2y - 1) / (e2y + 1);
  };

  Formula.FORECAST = function (x, data_y, data_x) {
    var xmean = jStat.mean(data_x);
    var ymean = jStat.mean(data_y);
    var n = data_x.length;
    var num = 0;
    var den = 0;
    for (var i = 0; i < n; i++) {
      num += (data_x[i] - xmean) * (data_y[i] - ymean);
      den += Math.pow(data_x[i] - xmean, 2);
    }
    var b = num / den;
    var a = ymean - b * xmean;
    return a + b * x;
  };

  Formula.FREQUENCY = function (data, bins) {
    var n = data.length;
    var b = bins.length;
    var r = [];
    for (var i = 0; i <= b; i++) {
      r[i] = 0;
      for (var j = 0; j < n; j++) {
        if (i === 0) {
          if (data[j] <= bins[0]) {
            r[0] += 1;
          }
        } else if (i < b) {
          if (data[j] > bins[i - 1] && data[j] <= bins[i]) {
            r[i] += 1;
          }
        } else if (i === b) {
          if (data[j] > bins[b - 1]) {
            r[b] += 1;
          }
        }
      }
    }
    return r;
  };

  Formula.GAMMA = function () {
    return jStat.gammafn.apply(this, arguments);
  };

  Formula.GAMMADIST = function (x, alpha, beta, cumulative) {
    /*
     var shape = alpha;
     var scale = 1 / beta;
     return (cumulative) ? jStat.gamma.cdf(x, shape, scale) : jStat.gamma.pdf(x, shape, scale);
     */
    return;
  };

  Formula.GAMMAINV = function (probability, alpha, beta) {
    /*
     var shape = alpha;
     var scale = 1 / beta;
     return jStat.gamma.inv(probability, shape, scale);
     */
    return;
  };

  Formula.GAMMALN = function () {
    return jStat.gammaln.apply(this, arguments);
  };

  Formula.GAMMALNPRECISE = function () {
    return;
  };

  Formula.GAUSS = function (z) {
    return jStat.normal.cdf(z, 0, 1) - 0.5;
  };

  Formula.GEOMEAN = function () {
    return jStat.geomean(Formula.ARGSCONCAT(arguments));
  };

  Formula.GROWTH = function (known_y, known_x, new_x, use_const) {
    // Credits: Ilmari Karonen

    // Default values for optional parameters:
    var i;
    if (typeof(known_x) === 'undefined') {
      known_x = [];
      for (i = 1; i <= known_y.length; i++) {
        known_x.push(i);
      }
    }
    if (typeof(new_x) === 'undefined') {
      new_x = [];
      for (i = 1; i <= known_y.length; i++) {
        new_x.push(i);
      }
    }
    if (typeof(use_const) === 'undefined') {
      use_const = true;
    }

    // Calculate sums over the data:
    var n = known_y.length;
    var avg_x = 0;
    var avg_y = 0;
    var avg_xy = 0;
    var avg_xx = 0;
    for (i = 0; i < n; i++) {
      var x = known_x[i];
      var y = Math.log(known_y[i]);
      avg_x += x;
      avg_y += y;
      avg_xy += x * y;
      avg_xx += x * x;
    }
    avg_x /= n;
    avg_y /= n;
    avg_xy /= n;
    avg_xx /= n;

    // Compute linear regression coefficients:
    var beta;
    var alpha;
    if (use_const) {
      beta = (avg_xy - avg_x * avg_y) / (avg_xx - avg_x * avg_x);
      alpha = avg_y - beta * avg_x;
    } else {
      beta = avg_xy / avg_xx;
      alpha = 0;
    }

    // Compute and return result array:
    var new_y = [];
    for (i = 0; i < new_x.length; i++) {
      new_y.push(Math.exp(alpha + beta * new_x[i]));
    }
    return new_y;
  };

  Formula.HARMEAN = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var den = 0;
    for (var i = 0; i < n; i++) {
      den += 1 / range[i];
    }
    return n / den;
  };

  Formula.HYPGEOMDIST = function (x, n, M, N, cumulative) {
    function pdf(x, n, M, N) {
      return Formula.COMBIN(M, x) * Formula.COMBIN(N - M, n - x) / Formula.COMBIN(N, n);
    }

    function cdf(x, n, M, N) {
      var result = 0;
      for (var i = 0; i <= x; i++) {
        result += pdf(i, n, M, N);
      }
      return result;
    }

    return (cumulative) ? cdf(x, n, M, N) : pdf(x, n, M, N);
  };

  Formula.INTERCEPT = function (data_y, data_x) {
    return Formula.FORECAST(0, data_y, data_x);
  };

  Formula.KURT = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var mean = jStat.mean(range);
    var n = range.length;
    var sigma = 0;
    for (var i = 0; i < n; i++) {
      sigma += Math.pow(range[i] - mean, 4);
    }
    sigma = sigma / Math.pow(jStat.stdev(range, true), 4);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sigma - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));
  };

  Formula.LARGE = function (array, k) {
    return array.sort(function (a, b) {
      return b - a;
    })[k - 1];
  };

  Formula.LINEST = function (data_y, data_x) {
    var xmean = jStat.mean(data_x);
    var ymean = jStat.mean(data_y);
    var n = data_x.length;
    var num = 0;
    var den = 0;
    for (var i = 0; i < n; i++) {
      num += (data_x[i] - xmean) * (data_y[i] - ymean);
      den += Math.pow(data_x[i] - xmean, 2);
    }
    var m = num / den;
    var b = ymean - m * xmean;
    return [m, b];
  };

  Formula.LOGEST = function () {
    return;
  };

  Formula.LOGNORMDIST = function (x, mean, sd, cumulative) {

    return (cumulative) ? jStat.lognormal.cdf(x, mean, sd) : jStat.lognormal.pdf(x, mean, sd);
  };

  Formula.LOGNORMINV = function (probability, mean, sd) {
    return jStat.lognormal.inv(probability, mean, sd);
  };

  Formula.MAX = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var max = (n > 0) ? range[0] : 0;
    for (var i = 0; i < n; i++) {
      max = (range[i] > max && (range[i] !== true) && (range[i] !== false)) ? range[i] : max;
    }
    return max;
  };

  Formula.MAXA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    return (range.length > 0) ? Math.max.apply(Math, range) : 0;
  };

  Formula.MEDIAN = function () {
    return jStat.median(Formula.ARGSCONCAT(arguments));
  };

  Formula.MIN = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var min = (n > 0) ? range[0] : 0;
    for (var i = 0; i < n; i++) {
      min = (range[i] < min && (range[i] !== true) && (range[i] !== false)) ? range[i] : min;
    }
    return min;
  };

  Formula.MINA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    return (range.length > 0) ? Math.min.apply(Math, range) : 0;
  };

  Formula.MODEMULT = function () {
    // Credits: Roönaän
    var range = Formula.ARGSCONCAT(arguments),
      n = range.length,
      count = {},
      maxItems = [],
      max = 0,
      currentItem;
    for (var i = 0; i < n; i++) {
      currentItem = range[i];
      count[currentItem] = count[currentItem] ? count[currentItem] + 1 : 1;
      if (count[currentItem] > max) {
        max = count[currentItem];
        maxItems = [];
      }
      if (count[currentItem] === max) {
        maxItems[maxItems.length] = currentItem;
      }
    }
    return maxItems;
  };

  Formula.MODESNGL = function () {
    return Formula.MODEMULT(Formula.ARGSCONCAT(arguments)).sort(function (a, b) {
      return a - b;
    })[0];
  };

  Formula.NEGBINOMDIST = function (k, r, p, cumulative) {
    return (cumulative) ? jStat.negbin.cdf(k, r, p) : jStat.negbin.pdf(k, r, p);
  };

  Formula.NORMDIST = function (x, mean, sd, cumulative) {
    // Check parameters
    if (isNaN(x) || isNaN(mean) || isNaN(sd)) {
      return '#VALUE!';
    }
    if (sd <= 0) {
      return '#NUM!';
    }

    // Return normal distribution computed by jStat [http://jstat.org]
    return (cumulative) ? jStat.normal.cdf(x, mean, sd) : jStat.normal.pdf(x, mean, sd);
  };

  Formula.NORMINV = function (probability, mean, sd) {
    return jStat.normal.inv(probability, mean, sd);
  };

  Formula.NORMSDIST = function (z, cumulative) {
    return (cumulative) ? jStat.normal.cdf(z, 0, 1) : jStat.normal.pdf(z, 0, 1);
  };

  Formula.NORMSINV = function (probability) {
    return jStat.normal.inv(probability, 0, 1);
  };

  Formula.PEARSON = function (data_x, data_y) {
    var xmean = jStat.mean(data_x);
    var ymean = jStat.mean(data_y);
    var n = data_x.length;
    var num = 0;
    var den1 = 0;
    var den2 = 0;
    for (var i = 0; i < n; i++) {
      num += (data_x[i] - xmean) * (data_y[i] - ymean);
      den1 += Math.pow(data_x[i] - xmean, 2);
      den2 += Math.pow(data_y[i] - ymean, 2);
    }
    return num / Math.sqrt(den1 * den2);
  };

  Formula.PERCENTILEEXC = function (array, k) {
    array = array.sort(function (a, b) {
      {
        return a - b;
      }
    });
    var n = array.length;
    if (k < 1 / (n + 1) || k > 1 - 1 / (n + 1)) {
      return '#NUM!';
    }
    var l = k * (n + 1) - 1;
    var fl = Math.floor(l);
    return Formula.CLEANFLOAT((l === fl) ? array[l] : array[fl] + (l - fl) * (array[fl + 1] - array[fl]));
  };

  Formula.PERCENTILEINC = function (array, k) {
    array = array.sort(function (a, b) {
      return a - b;
    });
    var n = array.length;
    var l = k * (n - 1);
    var fl = Math.floor(l);
    return Formula.CLEANFLOAT((l === fl) ? array[l] : array[fl] + (l - fl) * (array[fl + 1] - array[fl]));
  };

  Formula.PERCENTRANKEXC = function (array, x, significance) {
    array = array.sort(function (a, b) {
      return a - b;
    });
    var uniques = _.uniq(array);
    var n = array.length;
    var m = uniques.length;
    significance = (typeof significance === 'undefined') ? 3 : significance;
    var power = Math.pow(10, significance);
    var result = 0;
    var match = false;
    var i = 0;
    while (!match && i < m) {
      if (x === uniques[i]) {
        result = (array.indexOf(uniques[i]) + 1) / (n + 1);
        match = true;
      } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
        result = (array.indexOf(uniques[i]) + 1 + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n + 1);
        match = true;
      }
      i++;
    }
    return Math.floor(result * power) / power;
  };

  Formula.PERCENTRANKINC = function (array, x, significance) {
    array = array.sort(function (a, b) {
      return a - b;
    });
    var uniques = _.uniq(array);
    var n = array.length;
    var m = uniques.length;
    significance = (typeof significance === 'undefined') ? 3 : significance;
    var power = Math.pow(10, significance);
    var result = 0;
    var match = false;
    var i = 0;
    while (!match && i < m) {
      if (x === uniques[i]) {
        result = array.indexOf(uniques[i]) / (n - 1);
        match = true;
      } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
        result = (array.indexOf(uniques[i]) + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n - 1);
        match = true;
      }
      i++;
    }
    return Math.floor(result * power) / power;
  };

  Formula.PERMUT = function (number, number_chosen) {
    return Formula.FACT(number) / Formula.FACT(number - number_chosen);
  };

  Formula.PERMUTATIONA = function (number, number_chosen) {
    return Math.pow(number, number_chosen);
  };

  Formula.PHI = function (x) {
    return Math.exp(-0.5 * x * x) / SQRT2PI;
  };

  Formula.POISSONDIST = function (x, mean, cumulative) {
    return (cumulative) ? jStat.poisson.cdf(x, mean) : jStat.poisson.pdf(x, mean);
  };

  Formula.PROB = function (range, probability, lower, upper) {
    if (typeof lower === 'undefined') {
      return 0;
    }

    upper = (typeof upper === 'undefined') ? lower : upper;
    if (lower === upper) {
      return (range.indexOf(lower) >= 0) ? probability[range.indexOf(lower)] : 0;
    }

    var sorted = range.sort(function (a, b) {
      return a - b;
    });
    var n = sorted.length;
    var result = 0;
    for (var i = 0; i < n; i++) {
      if (sorted[i] >= lower && sorted[i] <= upper) {
        result += probability[range.indexOf(sorted[i])];
      }
    }
    return result;
  };

  Formula.QUARTILEEXC = function (range, quart) {
    switch (quart) {
      case 1:
        return Formula.PERCENTILEEXC(range, 0.25);
      case 2:
        return Formula.PERCENTILEEXC(range, 0.5);
      case 3:
        return Formula.PERCENTILEEXC(range, 0.75);
      default:
        return '#NUM!';
    }
  };

  Formula.QUARTILEINC = function (range, quart) {
    switch (quart) {
      case 1:
        return Formula.PERCENTILEINC(range, 0.25);
      case 2:
        return Formula.PERCENTILEINC(range, 0.5);
      case 3:
        return Formula.PERCENTILEINC(range, 0.75);
      default:
        return '#NUM!';
    }
  };

  Formula.RANKAVG = function (number, range, order) {
    order = (typeof order === 'undefined') ? false : order;
    var sort = (order) ? function (a, b) {
      return a - b;
    } : function (a, b) {
      return b - a;
    };
    range = range.sort(sort);
    var count = Formula.COUNTIN(range, number);
    return (count > 1) ? (2 * range.indexOf(number) + count + 1) / 2 : range.indexOf(number) + 1;
  };

  Formula.RANKEQ = function (number, range, order) {
    order = (typeof order === 'undefined') ? false : order;
    var sort = (order) ? function (a, b) {
      return a - b;
    } : function (a, b) {
      return b - a;
    };
    range = range.sort(sort);
    return range.indexOf(number) + 1;
  };

  Formula.RSQ = function (data_x, data_y) {
    return Math.pow(Formula.PEARSON(data_x, data_y), 2);
  };

  Formula.SKEW = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var mean = jStat.mean(range);
    var n = range.length;
    var sigma = 0;
    for (var i = 0; i < n; i++) {
      sigma += Math.pow(range[i] - mean, 3);
    }
    return n * sigma / ((n - 1) * (n - 2) * Math.pow(jStat.stdev(range, true), 3));
  };

  Formula.SKEWP = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var mean = jStat.mean(range);
    var n = range.length;
    var m2 = 0;
    var m3 = 0;
    for (var i = 0; i < n; i++) {
      m3 += Math.pow(range[i] - mean, 3);
      m2 += Math.pow(range[i] - mean, 2);
    }
    m3 = m3 / n;
    m2 = m2 / n;
    return m3 / Math.pow(m2, 3 / 2);
  };

  Formula.SLOPE = function (data_y, data_x) {
    var xmean = jStat.mean(data_x);
    var ymean = jStat.mean(data_y);
    var n = data_x.length;
    var num = 0;
    var den = 0;
    for (var i = 0; i < n; i++) {
      num += (data_x[i] - xmean) * (data_y[i] - ymean);
      den += Math.pow(data_x[i] - xmean, 2);
    }
    return num / den;
  };

  Formula.SMALL = function (array, k) {
    return array.sort(function (a, b) {
      return a - b;
    })[k - 1];
  };

  Formula.STANDARDIZE = function (x, mean, sd) {
    return (x - mean) / sd;
  };

  Formula.STDEVA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var mean = jStat.mean(range);
    for (var i = 0; i < n; i++) {
      sigma += Math.pow(range[i] - mean, 2);
    }
    return Math.sqrt(sigma / (n - 1));
  };

  Formula.STDEVP = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var count = 0;
    var mean = Formula.AVERAGE(range);
    for (var i = 0; i < n; i++) {
      if (range[i] !== true && range[i] !== false) {
        sigma += Math.pow(range[i] - mean, 2);
        count++;
      }
    }
    return Math.sqrt(sigma / count);
  };

  Formula.STDEVPA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var mean = jStat.mean(range);
    for (var i = 0; i < n; i++) {
      sigma += Math.pow(range[i] - mean, 2);
    }
    return Math.sqrt(sigma / n);
  };

  Formula.STDEVS = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var count = 0;
    var mean = Formula.AVERAGE(range);
    for (var i = 0; i < n; i++) {
      if (range[i] !== true && range[i] !== false) {
        sigma += Math.pow(range[i] - mean, 2);
        count++;
      }
    }
    return Math.sqrt(sigma / (count - 1));
  };

  Formula.STEYX = function (data_y, data_x) {
    var xmean = jStat.mean(data_x);
    var ymean = jStat.mean(data_y);
    var n = data_x.length;
    var lft = 0;
    var num = 0;
    var den = 0;
    for (var i = 0; i < n; i++) {
      lft += Math.pow(data_y[i] - ymean, 2);
      num += (data_x[i] - xmean) * (data_y[i] - ymean);
      den += Math.pow(data_x[i] - xmean, 2);
    }
    return Math.sqrt((lft - num * num / den) / (n - 2));
  };

  Formula.TDIST = function (x, df, cumulative) {
    return (cumulative) ? jStat.studentt.cdf(x, df) : jStat.studentt.pdf(x, df);
  };

  Formula.TDIST2T = function () {
    return;
  };

  Formula.TDISTRT = function () {
    return;
  };

  Formula.TINV = function (probability, df) {
    return jStat.studentt.inv(probability, df);
  };

  Formula.TINV2T = function () {
    return;
  };

  Formula.TTEST = function () {
    return;
  };

  Formula.TREND = function () {
    return;
  };

  Formula.TRIMMEAN = function (range, percent) {
    var n = range.length;
    var trim = Formula.FLOOR(range.length * percent, 2) / 2;
    return jStat.mean(_.initial(_.rest(range.sort(function (a, b) {
      return a - b;
    }), trim), trim));
  };

  Formula.VARA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var mean = jStat.mean(range);
    for (var i = 0; i < n; i++) {
      sigma += Math.pow(range[i] - mean, 2);
    }
    return sigma / (n - 1);
  };

  Formula.VARP = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var count = 0;
    var mean = Formula.AVERAGE(range);
    for (var i = 0; i < n; i++) {
      if (range[i] !== true && range[i] !== false) {
        sigma += Math.pow(range[i] - mean, 2);
        count++;
      }
    }
    return sigma / count;
  };

  Formula.VARPA = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var mean = jStat.mean(range);
    for (var i = 0; i < n; i++) {
      sigma += Math.pow(range[i] - mean, 2);
    }
    return sigma / n;
  };

  Formula.VARS = function () {
    var range = Formula.ARGSCONCAT(arguments);
    var n = range.length;
    var sigma = 0;
    var count = 0;
    var mean = Formula.AVERAGE(range);
    for (var i = 0; i < n; i++) {
      if (range[i] !== true && range[i] !== false) {
        sigma += Math.pow(range[i] - mean, 2);
        count++;
      }
    }
    return sigma / (count - 1);
  };

  Formula.WEIBULLDIST = function (x, alpha, beta, cumulative) {
    return (cumulative) ? 1 - Math.exp(-Math.pow(x / beta, alpha)) : Math.pow(x, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha)) * alpha / Math.pow(beta, alpha);
  };

  Formula.ZTEST = function (range, x, sigma) {
    var n = range.length;
    var sd = (typeof sigma === 'undefined') ? Formula.STDEVS(range) : sigma;
    return 1 - Formula.NORMSDIST((Formula.AVERAGE(range) - x) / (sd / Math.sqrt(n)), Formula.TRUE);
  };


  // Text functions

  Formula.CHAR = function (number) {
    return String.fromCharCode(number);
  };

  Formula.CLEAN = function (text) {
    var re = /[\0-\x1F]/g;
    return text.replace(re, "");
  };

  Formula.CODE = function (text) {
    return text.charCodeAt(0);
  };

  Formula.CONCATENATE = function () {
    var string = '';
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== null && arguments[i] !== undefined) {
        string += arguments[i];
      }
    }

    return string;
  };

  Formula.DOLLAR = function (number, decimals) {
    decimals = (typeof decimals === 'undefined') ? 2 : decimals;
    var format = '';
    if (decimals <= 0) {
      number = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
      format = '($0,0)';
    } else if (decimals > 0) {
      format = '($0,0.' + new Array(decimals + 1).join('0') + ')';
    }
    return numeral(number).format(format);
  };

  Formula.EXACT = function (text1, text2) {
    return text1 === text2;
  };

  Formula.FIND = function (find_text, within_text, position) {
    position = (typeof position === 'undefined') ? 0 : position;
    return within_text.indexOf(find_text, position - 1) + 1;
  };

  Formula.FIXED = function (number, decimals, no_commas) {
    decimals = (typeof decimals === 'undefined') ? 2 : decimals;
    no_commas = (typeof no_commas === 'undefined') ? false : no_commas;
    var format = no_commas ? '0' : '0,0';
    if (decimals <= 0) {
      number = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } else if (decimals > 0) {
      format += '.' + new Array(decimals + 1).join('0');
    }
    return numeral(number).format(format);
  };

  Formula.JOIN = function (separator, array) {
    return array.join(separator);
  };

  Formula.LEFT = function (text, number) {
    number = (typeof number === 'undefined') ? 1 : number;
    return text.substring(0, number);
  };

  Formula.LEN = function (text) {
    return text.length;
  };

  Formula.LOWER = function (text) {
    return text ? text.toLowerCase() : text;
  };

  Formula.MID = function (text, start, number) {
    return text.substring(start - 1, number);
  };

  Formula.NUMBERVALUE = function (text, decimal_separator, group_separator) {
    decimal_separator = (typeof decimal_separator === 'undefined') ? '.' : decimal_separator;
    group_separator = (typeof group_separator === 'undefined') ? ',' : group_separator;
    return Number(text.replace(decimal_separator, '.').replace(group_separator, ''));
  };

  Formula.PROPER = function (text) {
    return text.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  Formula.REGEXEXTRACT = function (text, regular_expression) {
    var match = text.match(new RegExp(regular_expression));
    return match ? match[0] : null;
  };

  Formula.REGEXMATCH = function (text, regular_expression) {
    return text.match(new RegExp(regular_expression)) ? true : false;
  };

  Formula.REGEXREPLACE = function (text, regular_expression, replacement) {
    return text.replace(new RegExp(regular_expression), replacement);
  };

  Formula.REPLACE = function (text, position, length, new_text) {
    return text.substr(0, position - 1) + new_text + text.substr(position - 1 + length);
  };

  Formula.REPT = function (text, number) {
    return new Array(number + 1).join(text);
  };

  Formula.RIGHT = function (text, number) {
    number = (typeof number === 'undefined') ? 1 : number;
    return text.substring(text.length - number);
  };

  Formula.ROMAN = function (number) {
    // The MIT License
    // Copyright (c) 2008 Steven Levithan
    var digits = String(number).split('');
    var key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM', '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC', '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
    var roman = '';
    var i = 3;
    while (i--) {
      roman = (key[+digits.pop() + (i * 10)] || '') + roman;
    }
    return new Array(+digits.join('') + 1).join('M') + roman;
  };

  Formula.SEARCH = function (find_text, within_text, position) {
    position = (typeof position === 'undefined') ? 0 : position;
    return within_text.toLowerCase().indexOf(find_text.toLowerCase(), position - 1) + 1;
  };

  Formula.SPLIT = function (text, separator) {
    return _s.words(text, separator);
  };

  Formula.SUBSTITUTE = function (text, old_text, new_text, occurrence) {
    if (!text || !old_text || !new_text) {
      return text;
    } else if (typeof occurrence === 'undefined') {
      return text.replace(new RegExp(old_text, 'g'), new_text);
    } else {
      var index = 0;
      var i = 0;
      while (text.indexOf(old_text, index) > 0) {
        index = text.indexOf(old_text, index + 1);
        i++;
        if (i === occurrence) {
          return text.substring(0, index) + new_text + text.substring(index + old_text.length);
        }
      }
    }
  };

  Formula.T = function (value) {
    return (typeof value === "string") ? value : null;
  };

  Formula.HTML2TEXT = function (value) {
    var result = '';

    if (value) {
      if (value instanceof Array) {
        value.forEach(function(line) {
          if (result !== '') {
            result += '\n';
          }
          result += (line.replace(/<(?:.|\n)*?>/gm, ''));
        });
      } else {
        result = value.replace(/<(?:.|\n)*?>/gm, '');
      }
    }

    return result;
  };

  Formula.HUMANIZE = function(value) {
    if (value instanceof Date) {
      var dvalue = moment(value);
      if (dvalue.hours() || dvalue.minutes() || dvalue.seconds()) {
        return dvalue.format("dddd, MMMM Do YYYY, h:mm:ss");
      } else {
        return dvalue.format("dddd, MMMM Do YYYY");
      }
    }

    return value;
  };

  Formula.TEXT = function (value, format) {
    var text = '';

    if (value) {
      if (value instanceof Object) {
        try {
          text = JSON.stringify(value);
        } catch (err) {
          // ignore
        }
      } else if (typeof value === 'string') {
        if (format) {
          text = (format.indexOf('0') >= 0) ? numeral(value).format(format) : moment(new Date(value)).format(format);
        } else {
          text = value;
        }
      } else if (value.toString && typeof value.toString === 'function') {
        text = value.toString();
      }
    }

    return text;
  };

  Formula.TRIM = function (text) {
    return _s.clean(text);
  };

  Formula.UNICHAR = Formula.CHAR;

  Formula.UNICODE = Formula.CODE;

  Formula.UPPER = function (text) {
    return text.toUpperCase();
  };

  Formula.VALUE = function (text) {
    return numeral().unformat(text);
  };
}).call(this);


},{"jStat":2,"lodash":3,"moment":4,"numeral":5,"numeric":6,"underscore.string":7}],2:[function(require,module,exports){
/**
 * jStat - JavaScript Statistical Library
 * Copyright (c) 2011
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php */
this.j$ = this.jStat = (function( Math, undefined ) {

	// for quick reference
var slice = Array.prototype.slice,
	toString = Object.prototype.toString,

	// calculate correction for IEEE error
	calcRdx = function( n, m ) {
		var val = n > m ? n : m;
		return Math.pow( 10, 17 - ~~( Math.log((( val > 0 ) ? val : -val )) * Math.LOG10E ));
	},

	// test if array
	isArray = Array.isArray || function( arg ) {
		return toString.call( arg ) === '[object Array]';
	},

	// test if function
	isFunction = function( arg ) {
		return toString.call( arg ) === '[object Function]';
	},

	// test if number and not NaN
	isNumber = function( arg ) {
		return toString.call( arg ) === '[object Number]' && !isNaN( arg );
	};

// global function
function jStat() {
	return new jStat.fn.init( arguments );
}

// extend jStat prototype
jStat.fn = jStat.prototype = {
	constructor : jStat,
	init : function( args ) {
		var i = 0;
		// if first argument is an array, must be vector or matrix
		if ( isArray( args[0] )) {
			// check if matrix
			if ( isArray( args[0][0] )) {
				// see if a mapping function was also passed
				if ( isFunction( args[1] )) {
					args[0] = jStat.map( args[0], args[1] );
				}
				// itterating over each is faster than this.push.apply( this, args[0] );
				for ( ; i < args[0].length; i++ ) {
					this[i] = args[0][i];
				}
				this.length = args[0].length;
			// so must be vector
			} else {
				this[0] = isFunction( args[1] ) ? jStat.map( args[0], args[1] ) : args[0];
				this.length = 1;
			}
		// if first argument is number, assume creation of sequence
		} else if ( isNumber( args[0] )) {
			this[0] = jStat.seq.apply( null, args );
			this.length = 1;
		// handle case when jStat object is passed to jStat
		} else if ( args[0] instanceof jStat ) {
			// duplicate the object and pass it back
			return jStat( args[0].toArray() );
		// unexpected argument value, return empty jStat object
		} else {
			this[0] = [];
			this.length = 1;
		}
		return this;
	},

	// default length
	length : 0,

	// return clean array
	toArray : function() {
		return ( this.length > 1 ) ?
			slice.call( this )
		: slice.call( this )[0];
	},

	// only to be used internally
	push : [].push,
	sort : [].sort,
	splice : [].splice
};

// for later instantiation
jStat.fn.init.prototype = jStat.fn;

// utility functions
jStat.utils = {
	calcRdx : calcRdx,
	isArray : isArray,
	isFunction : isFunction,
	isNumber : isNumber
};

// create method for easy extension
jStat.extend = function( obj ) {
	var args = slice.call( arguments ),
		i = 1, j;
	if ( args.length === 1 ) {
		for ( j in obj ) {
			jStat[j] = obj[j];
		}
		return this;
	}
	for ( ; i < args.length; i++ ) {
		for ( j in args[i] ) obj[j] = args[i][j];
	}
	return obj;
};

// static methods
jStat.extend({

	// Returns the number of rows in the matrix
	rows : function( arr ) {
		return arr.length || 1;
	},

	// Returns the number of columns in the matrix
	cols : function( arr ) {
		return arr[0].length || 1;
	},

	// Returns the dimensions of the object { rows: i, cols: j }
	dimensions : function( arr ) {
		return {
			rows : jStat.rows( arr ),
			cols : jStat.cols( arr )
		};
	},

	// Returns a specified row as a vector
	row : function( arr, index ) {
		return arr[ index ];
	},

	// Returns the specified column as a vector
	col : function( arr, index ) {
		var column = new Array( arr.length ),
			i = 0;
		for ( ; i < arr.length; i++ ) {
			column[i] = [ arr[i][index] ];
		}
		return column;
	},

	// Returns the diagonal of the matrix
	diag : function( arr ) {
		var row = 0,
			nrow = jStat.rows( arr ),
			res = new Array( nrow );
		for ( ; row < nrow; row++ ) {
			res[row] = [ arr[row][row] ];
		}
		return res;
	},

	// Returns the anti-diagonal of the matrix
	antidiag : function( arr ) {
		var nrow = jStat.rows( arr ) - 1,
			res = new Array( nrow ),
			i = 0;
		for ( ; nrow >= 0; nrow--, i++ ) {
			res[i] = [ arr[i][nrow] ];
		}
		return res;
	},

	// transpose a matrix or array
	transpose : function( arr ) {
		var obj = [],
			i = 0,
			rows, cols, j;
		// make sure arr is in matrix format
		if ( !isArray( arr[0] )) arr = [ arr ];
		rows = arr.length;
		cols = arr[0].length;
		for ( ; i < cols; i++ ) {
			obj.push( new Array( rows ));
			for ( j = 0; j < rows; j++ ) {
				obj[i][j] = arr[j][i];
			}
		}
		// if obj is vector, return only single array
		return ( obj.length === 1 ) ? obj[0] : obj;
	},

	// map a function to an array or array of arrays
	// toAlter is an internal variable
	map : function( arr, func, toAlter ) {
		var row = 0,
			nrow, ncol, res, col;
		if ( !isArray( arr[0] )) arr = [ arr ];
		nrow = arr.length;
		ncol = arr[0].length;
		res = toAlter ? arr : new Array( nrow );
		for ( ; row < nrow; row++ ) {
			// if the row doesn't exist, create it
			if ( !res[row] ) res[row] = new Array( ncol );
			for ( col = 0; col < ncol; col++ )
				res[row][col] = func( arr[row][col], row, col );
		}
		return ( res.length === 1 ) ? res[0] : res;
	},

	// destructively alter an array
	alter : function( arr, func ) {
		return jStat.map( arr, func, true );
	},

	// generate a rows x cols matrix according to the supplied function
	create : function ( rows, cols, func ) {
		var res = new Array( rows ), i, j;
		if ( isFunction( cols )) {
			func = cols;
			cols = rows;
		}
		for ( i = 0; i < rows; i++ ) {
			res[i] = new Array( cols );
			for ( j = 0; j < cols; j++ ) {
				res[i][j] = func( i, j );
			}
		}
		return res;
	},

	// generate a rows x cols matrix of zeros
	zeros : function( rows, cols ) {
		if ( !isNumber( cols )) cols = rows;
		return jStat.create( rows, cols, function() { return 0; });
	},

	// generate a rows x cols matrix of ones
	ones : function( rows, cols ) {
		if ( !isNumber( cols )) cols = rows;
		return jStat.create( rows, cols, function() { return 1; });
	},

	// generate a rows x cols matrix of uniformly random numbers
	rand : function( rows, cols ) {
		if ( !isNumber( cols )) cols = rows;
		return jStat.create( rows, cols, function() { return Math.random(); });
	},

	// generate an identity matrix of size row x cols
	identity : function( rows, cols ) {
		if ( !isNumber( cols )) cols = rows;
		return jStat.create( rows, cols, function( i, j ) { return ( i === j ) ? 1 : 0; });
	},

	// Tests whether a matrix is symmetric
	symmetric : function( arr ) {
		var issymmetric = true,
			row = 0,
			size = arr.length, col;
		if ( arr.length !== arr[0].length ) return false;
		for ( ; row < size; row++ ) {
			for ( col = 0; col < size; col++ ) {
				if ( arr[col][row] !== arr[row][col] ) return false;
			}
		}
		return true;
	},

	// set all values to zero
	clear : function( arr ) {
		return jStat.alter( arr, function() { return 0; });
	},

	// generate sequence
	seq : function( min, max, length, func ) {
		if ( !isFunction( func )) func = false;
		var arr = [],
			hival = calcRdx( min, max ),
			step = ( max * hival - min * hival ) / (( length - 1 ) * hival ),
			current = min,
			cnt = 0;
		// current is assigned using a technique to compensate for IEEE error
		for ( ; current <= max; cnt++, current = ( min * hival + step * hival * cnt ) / hival )
			arr.push(( func ? func( current, cnt ) : current ));
		return arr;
	}
});

// extend jStat.fn with methods that have no argument
(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		jStat.fn[ passfunc ] = function( func ) {
			var tmpthis = this,
				results;
			// check for callback
			if ( func ) {
				setTimeout(function() {
					func.call( tmpthis, jStat.fn[ passfunc ].call( tmpthis ));
				}, 15 );
				return this;
			}
			results = jStat[ passfunc ]( this );
			return isArray( results ) ? jStat( results ) : results;
		};
	})( funcs[i] );
})( 'transpose clear symmetric rows cols dimensions diag antidiag'.split( ' ' ));

// extend jStat.fn with methods that have one argument
(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		jStat.fn[ passfunc ] = function( index, func ) {
			var tmpthis = this;
			// check for callback
			if ( func ) {
				setTimeout(function() {
					func.call( tmpthis, jStat.fn[ passfunc ].call( tmpthis, index ));
				}, 15 );
				return this;
			}
			return jStat( jStat[ passfunc ]( this, index ));
		};
	})( funcs[i] );
})( 'row col'.split( ' ' ));

// extend jStat.fn with simple shortcut methods
(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		jStat.fn[ passfunc ] = function() {
			return jStat( jStat[ passfunc ].apply( null, arguments ));
		};
	})( funcs[i] );
})( 'create zeros ones rand identity'.split( ' ' ));

// extend jStat.fn
// specialized instance methods that can't have generalized assignments
jStat.extend( jStat.fn, {

	// map a function to a matrix or vector
	map : function( func, toAlter ) {
		return jStat( jStat.map( this, func, toAlter ));
	},

	// destructively alter an array
	alter : function( func ) {
		jStat.alter( this, func );
		return this;
	}
});

// exposing jStat
return jStat;

})( Math );
(function( jStat, Math ) {

	// for quick reference
var isFunction = jStat.utils.isFunction,

	// ascending functions for sort
	ascNum = function( a, b ) { return a - b; };

jStat.extend({

	// sum of an array
	sum : function( arr ) {
		var sum = 0,
			i = arr.length,
			tmp;
		while ( --i >= 0 ) {
			sum += arr[i];
		}
		return sum;
	},

	// sum squared
	sumsqrd : function( arr ) {
		var sum = 0,
			i = arr.length;
		while ( --i >= 0 ) sum += arr[i] * arr[i];
		return sum;
	},

	// sum of squared errors of prediction (SSE)
	sumsqerr : function( arr ) {
		var mean = jStat.mean( arr ),
			sum = 0,
			i = arr.length,
			tmp;
		while ( --i >= 0 ) {
			tmp = arr[i] - mean;
			sum += tmp * tmp;
		}
		return sum;
	},

	// product of an array
	product : function( arr ) {
		var prod = 1,
			i = arr.length;
		while ( --i >= 0 ) prod *= arr[i];
		return prod;
	},

	// minimum value of an array
	min : function( arr ) {
		var low = arr[0],
			i = 0;
		while ( ++i < arr.length )
			if ( arr[i] < low ) low = arr[i];
		return low;
	},

	// maximum value of an array
	max : function( arr ) {
		var high = arr[0],
			i = 0;
		while ( ++i < arr.length )
			if ( arr[i] > high ) high = arr[i];
		return high;
	},

	// mean value of an array
	mean : function( arr ) {
		return jStat.sum( arr ) / arr.length;
	},

	// mean squared error (MSE)
	meansqerr : function( arr ) {
		return jStat.sumsqerr( arr ) / arr.length;
	},

	// geometric mean of an array
	geomean : function( arr ) {
		return Math.pow( jStat.product( arr ), 1 / arr.length );
	},

	// median of an array
	median : function( arr ) {
		var arrlen = arr.length,
			_arr = arr.slice().sort( ascNum );
		// check if array is even or odd, then return the appropriate
		return !( arrlen & 1 )
			? ( _arr[( arrlen / 2 ) - 1 ] + _arr[( arrlen / 2 )]) / 2
		: _arr[( arrlen / 2 ) | 0 ];
	},

	// cumulative sum of an array
	cumsum : function( arr ) {
		var len = arr.length,
			sums = new Array( len ),
			i = 1;
		sums[0] = arr[0];
		for ( ; i < len; i++ ) {
			sums[i] = sums[i - 1] + arr[i];
		}
		return sums;
	},

	// successive differences of a sequence
	diff : function( arr ) {
		var diffs = [],
			arrLen = arr.length,
			i = 1;
		for ( i = 1; i < arrLen; i++ ) {
			diffs.push( arr[i] - arr[i-1]);
		}
		return diffs;
	},

	// mode of an array
	// if there are multiple modes of an array, just returns false
	// is this the appropriate way of handling it?
	mode : function( arr ) {
		var arrLen = arr.length,
			_arr = arr.slice().sort( ascNum ),
			count = 1,
			maxCount = 0,
			numMaxCount = 0,
			i = 0,
			maxNum;
		for ( ; i < arrLen; i++ ) {
			if ( _arr[ i ] === _arr[ i + 1 ] ) {
				count++;
			} else {
				if ( count > maxCount ) {
					maxNum = _arr[i];
					maxCount = count;
					count = 1;
					numMaxCount = 0;
				} else {
					// are there multiple max counts
					if ( count === maxCount ) {
						numMaxCount++;
					// count is less than max count, so reset values
					} else {
						count = 1;
					}
				}
			}
		}
		return ( numMaxCount === 0 ) ? maxNum : false;
	},

	// range of an array
	range : function( arr ) {
		return jStat.max( arr ) - jStat.min( arr );
	},

	// variance of an array
	// flag indicates population vs sample
	variance : function( arr, flag ) {
		return jStat.sumsqerr( arr ) / ( arr.length - ( flag ? 1 : 0 ));
	},

	// standard deviation of an array
	// flag indicates population vs sample
	stdev : function( arr, flag ) {
		return Math.sqrt( jStat.variance( arr, flag ));
	},

	// mean deviation (mean absolute deviation) of an array
	meandev : function( arr ) {
		var devSum = 0,
			mean = jStat.mean( arr ),
			i = arr.length - 1;
		for ( ; i >= 0; i-- ) {
			devSum += Math.abs( arr[i] - mean );
		}
		return devSum / arr.length;
	},

	// median deviation (median absolute deviation) of an array
	meddev : function( arr ) {
		var devSum = 0,
			median = jStat.median( arr ),
			i = arr.length - 1;
		for ( ; i >= 0; i-- ) {
			devSum += Math.abs( arr[i] - median );
		}
		return devSum / arr.length;
	},

	// coefficient of variation
	coeffvar : function( arr ) {
		return jStat.stdev( arr ) / jStat.mean( arr );
	},

	// quartiles of an array
	quartiles : function( arr ) {
		var arrlen = arr.length,
			_arr = arr.slice().sort( ascNum );
		return [
			_arr[ Math.round(( arrlen ) / 4 ) - 1 ],
			_arr[ Math.round(( arrlen ) / 2 ) - 1 ],
			_arr[ Math.round(( arrlen ) * 3 / 4 ) - 1 ]
		];
	},

	// covariance of two arrays
	covariance : function( arr1, arr2 ) {
		var u = jStat.mean( arr1 ),
			v = jStat.mean( arr2 ),
			arr1Len = arr1.length,
			sq_dev = new Array(arr1Len),
			i = 0;
		for ( ; i < arr1Len; i++ ) {
			sq_dev[i] = ( arr1[i] - u ) * ( arr2[i] - v );
		}
		return jStat.sum( sq_dev ) / ( arr1Len - 1 );
	},

	// population correlation coefficient
	corrcoeff : function( arr1, arr2 ) {
		return jStat.covariance( arr1, arr2 ) / jStat.stdev( arr1, 1 ) / jStat.stdev( arr2, 1 );
	}
});

// extend jStat.fn with methods which don't require arguments and work on columns
(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		// if a matrix is passed, automatically assume operation should be done on the columns
		jStat.fn[ passfunc ] = function( fullbool, func ) {
			var arr = [],
				i = 0,
				tmpthis = this;
			// assignment reassignation depending on how parameters were passed in
			if ( isFunction( fullbool )) {
				func = fullbool;
				fullbool = false;
			}
			// check if a callback was passed with the function
			if ( func ) {
				setTimeout( function() {
					func.call( tmpthis, jStat.fn[ passfunc ].call( tmpthis, fullbool ));
				}, 15 );
				return this;
			}
			// check if matrix and run calculations
			if ( this.length > 1 ) {
				tmpthis = fullbool === true ? this : this.transpose();
				for ( ; i < tmpthis.length; i++ )
					arr[i] = jStat[ passfunc ]( tmpthis[i] );
				return fullbool === true ? jStat[ passfunc ]( arr ) : arr;
			}
			// pass fullbool if only vector, not a matrix. for variance and stdev
			return jStat[ passfunc ]( this[0], fullbool );
		};
	})( funcs[i] );
})( 'sum sumsqrd sumsqerr product min max mean meansqerr geomean median cumsum diff mode range variance stdev meandev meddev coeffvar quartiles'.split( ' ' ));

}( this.jStat, Math ));
// Special functions //
(function( jStat, Math ) {

// extending static jStat methods
jStat.extend({

	// Log-gamma function
	gammaln : function( x ) {
		var j = 0,
			cof = [
				76.18009172947146, -86.50532032941677, 24.01409824083091,
				-1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
			],
			ser = 1.000000000190015,
			xx, y, tmp;
		tmp = ( y = xx = x ) + 5.5;
		tmp -= ( xx + 0.5 ) * Math.log( tmp );
		for ( ; j < 6; j++ ) ser += cof[j] / ++y;
		return Math.log( 2.5066282746310005 * ser / xx) - tmp;
	},

	// gamma of x
	gammafn : function( x ) {
		var p = [
				-1.716185138865495, 24.76565080557592, -379.80425647094563,
				629.3311553128184, 866.9662027904133, -31451.272968848367,
				-36144.413418691176, 66456.14382024054
			],
			q = [
				-30.8402300119739, 315.35062697960416, -1015.1563674902192,
				-3107.771671572311, 22538.118420980151, 4755.8462775278811,
				-134659.9598649693, -115132.2596755535
			],
			fact = false,
			n = 0,
			xden = 0,
			xnum = 0,
			y = x,
			i, z, yi, res, sum, ysq;
		if( y <= 0 ) {
			res = y % 1 + 3.6e-16;
			if ( res ) {
				fact = (!( y & 1 ) ? 1 : -1 ) * Math.PI / Math.sin( Math.PI * res );
				y = 1 - y;
			} else {
				return Infinity;
			}
		}
		yi = y;
		if ( y < 1 ) {
			z = y++;
		} else {
			z = ( y -= n = ( y | 0 ) - 1 ) - 1;
		}
		for ( i = 0; i < 8; ++i ) {
			xnum = ( xnum + p[i] ) * z;
			xden = xden * z + q[i];
		}
		res = xnum / xden + 1;
		if ( yi < y ) {
			res /= yi;
		} else if ( yi > y ) {
			for ( i = 0; i < n; ++i ) {
				res *= y;
				y++;
			}
		}
		if ( fact ) {
			res = fact / res;
		}
		return res;
	},

	// lower incomplete gamma function P(a,x)
	gammap : function( a, x ) {
		var aln = jStat.gammaln( a ),
			ap = a,
			sum = 1 / a,
			del = sum,
			b = x + 1 - a,
			c = 1 / 1.0e-30,
			d = 1 / b,
			h = d,
			i = 1,
			// calculate maximum number of itterations required for a
			ITMAX = -~( Math.log(( a >= 1 ) ? a : 1 / a ) * 8.5 + a * 0.4 + 17 ),
			an, endval;
		if ( x < 0 || a <= 0 ) {
			return NaN;
		} else if ( x < a + 1 ) {
			for ( ; i <= ITMAX; i++ ) {
				sum += del *= x / ++ap;
			}
			return sum * Math.exp( -x + a * Math.log( x ) - ( aln ));
		}
		for ( ; i <= ITMAX; i++ ) {
			an = -i * ( i - a );
			b += 2;
			d = an * d + b;
			c = b + an / c;
			d = 1 / d;
			h *= d * c;
		}
		return 1 - h * Math.exp( -x + a * Math.log( x ) - ( aln ));
	},

	// natural log factorial of n
	factorialln : function( n ) {
		return n < 0 ? NaN : jStat.gammaln( n + 1 );
	},

	// factorial of n
	factorial : function( n ) {
		return n < 0 ? NaN : jStat.gammafn( n + 1 );
	},

	// combinations of n, m
	combination : function( n, m ) {
		// make sure n or m don't exceed the upper limit of usable values
		return ( n > 170 || m > 170 ) ?
			Math.exp( jStat.combinationln( n, m )) :
		( jStat.factorial( n ) / jStat.factorial( m )) / jStat.factorial( n - m );
	},
	
	combinationln : function( n, m ){
		return  jStat.factorialln( n ) - jStat.factorialln( m ) - jStat.factorialln( n - m );
	},

	// permutations of n, m
	permutation : function( n, m ) {
		return jStat.factorial( n ) / jStat.factorial( n - m );
	},

	// beta function
	betafn : function( x, y ) {
		// ensure arguments are positive
		if ( x <= 0 || y <= 0 ) return undefined;
		// make sure x + y doesn't exceed the upper limit of usable values
		return ( x + y > 170 ) ?
			Math.exp( jStat.betaln( x, y )) :
		jStat.gammafn( x ) * jStat.gammafn( y ) / jStat.gammafn( x + y );
	},
	
	// natural logarithm of beta function
	betaln : function( x, y ) {
		return jStat.gammaln( x ) + jStat.gammaln( y ) - jStat.gammaln( x + y );
	},

	// evaluates the continued fraction for incomplete beta function by modified Lentz's method.
	betacf : function( x, a, b ) {
		var fpmin = 1e-30,
			m = 1,
			m2, aa, c, d, del, h, qab, qam, qap;
		// These q's will be used in factors that occur in the coefficients
		qab = a + b;
		qap = a + 1;
		qam = a - 1;
		c = 1;
		d = 1 - qab * x / qap;
		if( Math.abs( d ) < fpmin ) d = fpmin;
		d = 1 / d;
		h = d;
		for ( ; m <= 100; m++ ) {
			m2 = 2 * m;
			aa = m * ( b - m ) * x / ( ( qam + m2 ) * ( a + m2 ) );
			// One step (the even one) of the recurrence
			d = 1 + aa * d;
			if( Math.abs( d ) < fpmin ) d = fpmin;
			c = 1 + aa / c;
			if( Math.abs( c ) < fpmin ) c = fpmin;
			d = 1 / d;
			h *= d * c;
			aa = -( a + m ) * ( qab + m ) * x / ( ( a + m2 ) * ( qap + m2 ) );
			// Next step of the recurrence (the odd one)
			d = 1 + aa * d;
			if( Math.abs( d ) < fpmin ) d = fpmin;
			c = 1 + aa / c;
			if( Math.abs( c ) < fpmin ) c = fpmin;
			d = 1 / d;
			del = d * c;
			h *= del;
			if( Math.abs( del - 1.0 ) < 3e-7 ) break;
		}
		return h;
	},

	// Returns the inverse incomplte gamma function
	gammapinv : function( p, a ) {
		var j = 0,
			a1 = a - 1,
			EPS = 1e-8,
			gln = jStat.gammaln( a ),
			x, err, t, u, pp, lna1, afac;
		if( p >= 1 ) return Math.max( 100, a + 100 * Math.sqrt( a ) );
		if( p <= 0 ) return 0;
		if( a > 1 ) {
			lna1 = Math.log( a1 );
			afac = Math.exp( a1 * ( lna1 - 1 ) - gln );
			pp = ( p < 0.5 ) ? p : 1 - p;
			t = Math.sqrt( -2 * Math.log( pp ));
			x = ( 2.30753 + t * 0.27061 ) / ( 1 + t * ( 0.99229 + t * 0.04481 )) - t;
			if( p < 0.5 ) x = -x;
			x = Math.max( 1e-3, a * Math.pow( 1 - 1 / ( 9 * a ) - x / ( 3 * Math.sqrt( a )), 3 ));
		} else {
			t = 1 - a * ( 0.253 + a * 0.12 );
			if( p < t ) x = Math.pow( p / t, 1 / a);
			else x = 1 - Math.log( 1 - ( p - t ) / ( 1 - t ));
		}
		for( ; j < 12; j++ ) {
			if( x <= 0 ) return 0;
			err = jStat.gammap( a, x ) - p;
			if( a > 1 ) t = afac * Math.exp( -( x - a1 ) + a1 * ( Math.log( x ) - lna1 ));
			else t = Math.exp( -x + a1 * Math.log( x ) - gln );
			u = err / t;
			x -= ( t = u / ( 1 - 0.5 * Math.min( 1, u * ( ( a - 1 ) / x - 1 ))));
			if( x <= 0 ) x = 0.5 * ( x + t );
			if( Math.abs( t ) < EPS * x ) break;
		}
		return x;
	},

	// Returns the error function erf(x)
	erf : function( x ) {
		var cof = [
				-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
				-9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
				4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
				1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
				6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
				-2.27365122e-10, 9.6467911e-11, 2.394038e-12,
				-6.886027e-12, 8.94487e-13, 3.13092e-13,
				-1.12708e-13, 3.81e-16, 7.106e-15,
				-1.523e-15, -9.4e-17, 1.21e-16,
				-2.8e-17
			],
			j = cof.length - 1,
			isneg = false,
			d = 0,
			dd = 0,
			t, ty, tmp, res;
		if( x < 0 ) {
			x = -x;
			isneg = true;
		}
		t = 2 / ( 2 + x );
		ty = 4 * t - 2;
		for( ; j > 0; j-- ) {
			tmp = d;
			d = ty * d - dd + cof[j];
			dd = tmp;
		}
		res = t * Math.exp( -x*x + 0.5 * ( cof[0] + ty * d ) - dd );
		return ( isneg ) ? res - 1 : 1 - res;
	},

	// Returns the complmentary error function erfc(x)
	erfc : function( x ) {
		return 1 - jStat.erf( x );
	},

	// Returns the inverse of the complementary error function
	erfcinv : function( p ) {
		var j = 0,
			x, err, t, pp;
		if( p >= 2 ) return -100;
		if( p <= 0 ) return 100;
		pp = ( p < 1 ) ? p : 2 - p;
		t = Math.sqrt( -2 * Math.log( pp / 2 ));
		x = -0.70711 * (( 2.30753 + t * 0.27061 ) / ( 1 + t * ( 0.99229 + t * 0.04481)) - t );
		for( ; j < 2; j++ ) {
			err = jStat.erfc( x ) - pp;
			x += err / ( 1.12837916709551257 * Math.exp( -x * x ) - x * err );
		}
		return ( p < 1 ) ? x : -x;
	},

	// Returns the inverse of the incomplete beta function
	ibetainv : function( p, a, b ) {
		var EPS = 1e-8,
			a1 = a - 1,
			b1 = b - 1,
			j = 0,
			lna, lnb, pp, t, u, err, x, al, h, w, afac;
		if( p <= 0 ) return 0;
		if( p >= 1 ) return 1;
		if( a >= 1 && b >= 1 ) {
			pp = ( p < 0.5 ) ? p : 1 - p;
			t = Math.sqrt( -2 * Math.log( pp ));
			x = ( 2.30753 + t * 0.27061 ) / ( 1 + t* ( 0.99229 + t * 0.04481 )) - t;
			if( p < 0.5 ) x = -x;
			al = ( x * x - 3 ) / 6;
			h = 2 / ( 1 / ( 2 * a - 1 )  + 1 / ( 2 * b - 1 ));
			w = ( x * Math.sqrt( al + h ) / h ) - ( 1 / ( 2 * b - 1 ) - 1 / ( 2 * a - 1 )) * ( al + 5 / 6 - 2 / ( 3 * h ));
			x = a / ( a + b * Math.exp( 2 * w ));
		} else {
			lna = Math.log( a / ( a + b ));
			lnb = Math.log( b / ( a + b ));
			t = Math.exp( a * lna ) / a;
			u = Math.exp( b * lnb ) / b;
			w = t + u;
			if( p < t / w) x = Math.pow( a * w * p, 1 / a );
			else x = 1 - Math.pow( b * w * ( 1 - p ), 1 / b );
		}
		afac = -jStat.gammaln( a ) - jStat.gammaln( b ) + jStat.gammaln( a + b );
		for( ; j < 10; j++ ) {
			if( x === 0 || x === 1) return x;
			err = jStat.ibeta( x, a, b ) - p;
			t = Math.exp( a1 * Math.log( x ) + b1 * Math.log( 1 - x ) + afac );
			u = err / t;
			x -= ( t = u / ( 1 - 0.5 * Math.min( 1, u * ( a1 / x - b1 / ( 1 - x )))));
			if( x <= 0 ) x = 0.5 * ( x + t );
			if( x >= 1 ) x = 0.5 * ( x + t + 1 );
			if( Math.abs( t ) < EPS * x && j > 0 ) break;
		}
		return x;
	},

	// Returns the incomplete beta function I_x(a,b)
	ibeta : function( x, a, b ) {
		// Factors in front of the continued fraction.
		var bt = ( x === 0 || x === 1 ) ?  0 :
			Math.exp(jStat.gammaln( a + b ) - jStat.gammaln( a ) -
			jStat.gammaln( b ) + a * Math.log( x ) + b *
			Math.log( 1 - x ));
		if( x < 0 || x > 1 ) return false;
		if( x < ( a + 1 ) / ( a + b + 2 ) )
			// Use continued fraction directly.
			return bt * jStat.betacf( x, a, b ) / a;
		// else use continued fraction after making the symmetry transformation.
		return 1 - bt * jStat.betacf( 1 - x, b, a ) / b;
	},

	// Returns a normal deviate (mu=0, sigma=1).
	// If n and m are specified it returns a object of normal deviates.
	randn : function( n, m ) {
		var u, v, x, y, q, mat;
		if ( !m ) m = n;
		if( n ) {
			return jStat.create( n, m, function() { return jStat.randn(); });
		}
		do {
			u = Math.random();
			v = 1.7156 * ( Math.random() - 0.5 );
			x = u - 0.449871;
			y = Math.abs( v ) + 0.386595;
			q = x*x + y * ( 0.19600 * y - 0.25472 * x );
		} while( q > 0.27597 && ( q > 0.27846 || v*v > -4 * Math.log( u ) * u*u ));
		return v / u;
	},

	// Returns a gamma deviate by the method of Marsaglia and Tsang.
	randg : function( shape, n, m ) {
		var oalph = shape,
			a1, a2, u, v, x, mat;
		if ( !m ) m = n;
		if ( !shape ) shape = 1;
		if( n ) {
			mat = jStat.zeros( n,m );
			mat.alter(function() { return jStat.randg( shape ); });
			return mat;
		}
		if( shape < 1 ) shape += 1;
		a1 = shape - 1 / 3;
		a2 = 1 / Math.sqrt( 9 * a1 );
		do {
			do {
				x = jStat.randn();
				v = 1 + a2 * x;
			} while( v <= 0 );
			v = v * v * v;
			u = Math.random();
		} while( u > 1 - 0.331 * Math.pow( x, 4 ) &&
			Math.log( u ) > 0.5 * x*x + a1 * ( 1 - v + Math.log( v ) ));
		// alpha > 1
		if( shape == oalph ) return a1 * v;
		// alpha < 1
		do { u = Math.random(); } while( u === 0 );
		return Math.pow( u, 1 / oalph ) * a1 * v;
	}
});

// making use of static methods on the instance
(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		jStat.fn[ passfunc ] = function() {
			return jStat( jStat.map( this, function( value ) { return jStat[ passfunc ]( value ); }));
		};
	})( funcs[i] );
})( 'gammaln gammafn factorial factorialln'.split( ' ' ));

(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		jStat.fn[ passfunc ] = function() {
			return jStat( jStat[ passfunc ].apply( null, arguments ));
		};
	})( funcs[i] );
})( 'randn'.split( ' ' ));

})( this.jStat, Math );
(function( jStat, Math ) {

// generate all distribution instance methods
(function( list ) {
	for ( var i = 0; i < list.length; i++ ) (function( func ) {
		// distribution instance method
		jStat[ func ] = function( a, b, c ) {
			if (!( this instanceof arguments.callee )) return new arguments.callee( a, b, c );
			this._a = a;
			this._b = b;
			this._c = c;
			return this;
		};
		// distribution method to be used on a jStat instance
		jStat.fn[ func ] = function( a, b, c ) {
			var newthis = jStat[ func ]( a, b, c );
			newthis.data = this;
			return newthis;
		};
		// sample instance method
		jStat[ func ].prototype.sample = function( arr ) {
			var a = this._a,
				b = this._b,
				c = this._c;
			if ( arr )
				return jStat.alter( arr, function() {
					return jStat[ func ].sample( a, b, c );
				});
			else
				return jStat[ func ].sample( a, b, c );
		};
		// generate the pdf, cdf and inv instance methods
		(function( vals ) {
			for ( var i = 0; i < vals.length; i++ ) (function( fnfunc ) {
				jStat[ func ].prototype[ fnfunc ] = function( x ) {
					var a = this._a,
						b = this._b,
						c = this._c;
					if ( !x ) x = this.data;
					if ( typeof x !== 'number' ) {
						return jStat.fn.map.call( x, function( x ) {
							return jStat[ func ][ fnfunc ]( x, a, b, c );
						});
					}
					return jStat[ func ][ fnfunc ]( x, a, b, c );
				};
			})( vals[ i ]);
		})( 'pdf cdf inv'.split( ' ' ));
		// generate the mean, median, mode and variance instance methods
		(function( vals ) {
			for ( var i = 0; i < vals.length; i++ ) (function( fnfunc ) {
				jStat[ func ].prototype[ fnfunc ] = function() {
					return jStat[ func ][ fnfunc ]( this._a, this._b, this._c );
				};
			})( vals[ i ]);
		})( 'mean median mode variance'.split( ' ' ));
	})( list[ i ]);
})((
	'beta centralF cauchy chisquare exponential gamma invgamma kumaraswamy lognormal normal ' +
	'pareto studentt weibull uniform  binomial negbin hypgeom poisson triangular'
).split( ' ' ));



// extend beta function with static methods
jStat.extend( jStat.beta, {
	pdf : function( x, alpha, beta ) {
		return (x > 1 || x < 0) ? 0 : ( Math.pow( x, alpha - 1 ) * Math.pow( 1 - x, beta - 1 )) / jStat.betafn( alpha, beta );
	},

	cdf : function( x, alpha, beta ) {
		return (x > 1 || x < 0) ? (x > 1) * 1 : jStat.ibeta( x, alpha, beta );
	},

	inv : function( x, alpha, beta ) {
		return jStat.ibetainv( x, alpha, beta );
	},

	mean : function( alpha, beta ) {
		return alpha / ( alpha + beta );
	},

	median : function( alpha, beta ) {
		// TODO: implement beta median
	},

	mode : function( alpha, beta ) {
		return ( alpha * beta ) / ( Math.pow( alpha + beta, 2 ) * ( alpha + beta + 1 ));
	},

	// return a random sample
	sample : function( alpha, beta ) {
		var u = jStat.randg( alpha );
		return u / ( u + jStat.randg( beta ));
	},

	variance : function( alpha, beta ) {
		return ( alpha * beta ) / ( Math.pow( alpha + beta, 2 ) * ( alpha + beta + 1 ));
	}
});

// extend F function with static methods
jStat.extend( jStat.centralF, {
	pdf : function( x, df1, df2 ) {
		return  ( x >= 0) ?  
			Math.sqrt( ( Math.pow( df1 * x, df1) * Math.pow( df2, df2 ) ) / ( Math.pow(df1 * x + df2, df1 + df2 ) ) ) / ( x * jStat.betafn( df1/2, df2/2 ) ) : undefined;
		
	},

	cdf : function( x, df1, df2 ) {
		return jStat.ibeta( ( df1 * x ) / ( df1 * x + df2 ), df1 / 2, df2 / 2 );
	},

	inv : function( x, df1, df2 ) {
		return df2 / (df1 * ( 1 / jStat.ibetainv( x, df1 / 2, df2 / 2 ) - 1 ) );
	},

	mean : function( df1, df2 ) {
		return ( df2 > 2 ) ? df2 / ( df2 - 2 ) : undefined;
	},

	mode : function( df1, df2 ) {
		return ( df1 > 2) ? ( df2 * ( df1 - 2 ) ) / ( df1 * ( df2 + 2 ) ) : undefined;
	},

	// return a random sample
	sample : function( df1, df2 ) {
		var x1 = jStat.randg( df1 / 2 ) * 2;
		var x2 = jStat.randg( df2 / 2 ) * 2;
		return ( x1 / df1 ) / ( x2 / df2 );
	},

	variance : function( df1, df2 ) {
		return ( df2 > 4 ) ? 2 * df2 * df2 * ( df1 + df2 - 2) / ( df1 * ( df2 - 2 ) * ( df2 - 2 ) * ( df2 - 4 ) ): undefined;
	}
});


// extend cauchy function with static methods
jStat.extend( jStat.cauchy, {
	pdf : function( x, local, scale ) {
		return ( scale / ( Math.pow( x - local, 2 ) + Math.pow( scale, 2 ))) / Math.PI;
	},

	cdf : function( x, local, scale ) {
		return Math.atan(( x - local) / scale ) / Math.PI + 0.5;
	},

	inv : function( p, local, scale ) {
		return local + scale * Math.tan( Math.PI * ( p - 0.5 ));
	},

	median: function( local, scale ) {
		return local;
	},

	mode : function( local, scale ) {
		return local;
	},

	sample : function( local, scale ) {
		return jStat.randn() * Math.sqrt( 1 / ( 2 * jStat.randg( 0.5 ))) * scale + local;
	}
});



// extend chisquare function with static methods
jStat.extend( jStat.chisquare, {
	pdf : function( x, dof ) {
		return Math.exp(( dof / 2 - 1 ) * Math.log( x ) - x / 2 - ( dof / 2 ) * Math.log( 2 ) - jStat.gammaln( dof / 2 ));
	},

	cdf : function( x, dof ) {
		return jStat.gammap( dof / 2, x / 2 );
	},

	inv : function( p, dof ) {
		return 2 * jStat.gammapinv( p, 0.5 * dof );
	},

	mean : function( dof ) {
		return dof;
	},

	//TODO: this is an approximation (is there a better way?)
	median : function( dof ) {
		return dof * Math.pow( 1 - ( 2 / ( 9 * dof )), 3 );
	},

	mode : function( dof ) {
		return ( dof - 2 > 0 ) ? dof - 2 : 0;
	},

	sample : function( dof ) {
		return jStat.randg( dof / 2 ) * 2;
	},

	variance: function( dof ) {
		return 2 * dof;
	}
});



// extend exponential function with static methods
jStat.extend( jStat.exponential, {
	pdf : function( x, rate ) {
		return x < 0 ? 0 : rate * Math.exp( -rate * x );
	},

	cdf : function( x, rate ) {
		return x < 0 ? 0 : 1 - Math.exp( -rate * x );
	},

	inv : function( p, rate ) {
		return -Math.log( 1 - p ) / rate;
	},

	mean : function( rate ) {
		return 1 / rate;
	},

	median : function ( rate ) {
		return ( 1 / rate ) * Math.log( 2 );
	},

	mode : function( rate ) {
		return 0;
	},

	sample : function( rate ) {
		return -1 / rate * Math.log( Math.random());
	},

	variance : function( rate ) {
		return Math.pow( rate, -2 );
	}
});



// extend gamma function with static methods
jStat.extend( jStat.gamma, {
	pdf : function( x, shape, scale ) {
		return Math.exp(( shape - 1 ) * Math.log( x ) - x / scale - jStat.gammaln( shape ) - shape * Math.log( scale ));
	},

	cdf : function( x, shape, scale ) {
		return jStat.gammap( shape, x / scale );
	},

	inv : function( p, shape, scale ) {
		return jStat.gammapinv( p, shape ) * scale;
	},

	mean : function( shape, scale ) {
		return shape * scale;
	},

	mode : function( shape, scale ) {
		if( shape > 1 ) return ( shape - 1 ) * scale;
		return undefined;
	},

	sample : function( shape, scale ) {
		return jStat.randg( shape ) * scale;
	},

	variance: function( shape, scale ) {
		return shape * scale * scale;
	}
});

// extend inverse gamma function with static methods
jStat.extend( jStat.invgamma, {
	pdf : function( x, shape, scale ) {
		return Math.exp( -( shape + 1 ) * Math.log( x ) - scale/x - jStat.gammaln( shape ) + shape * Math.log( scale ) );
	},

	cdf : function( x, shape, scale ) {
		return 1 - jStat.gammap( shape, scale / x );
	},

	inv : function( p, shape, scale ) {
		return scale / jStat.gammapinv( 1 - p, shape );
	},

	mean : function( shape, scale ) {
		return ( shape > 1 ) ? scale / ( shape - 1 ) : undefined;
	},

	mode : function( shape, scale ) {
		return scale / ( shape + 1 );
	},

	sample : function( shape, scale ) {
		return scale / jStat.randg( shape );
	},

	variance: function( shape, scale ) {
		return (shape > 2) ? scale * scale / ( ( shape - 1 ) * ( shape - 1) * ( shape - 2 ) ): undefined;
	}
});


// extend kumaraswamy function with static methods
jStat.extend( jStat.kumaraswamy, {
	pdf : function( x, alpha, beta ) {
		return Math.exp( Math.log( alpha ) + Math.log( beta ) + ( alpha - 1 ) * Math.log( x ) + ( beta - 1 ) * Math.log( 1 - Math.pow( x, alpha )));
	},

	cdf : function( x, alpha, beta ) {
		return ( 1 - Math.pow( 1 - Math.pow( x, alpha ), beta ));
	},

	mean : function( alpha, beta ) {
		return ( beta * jStat.gammafn( 1 + 1 / alpha ) * jStat.gammafn( beta )) / ( jStat.gammafn( 1 + 1 / alpha + beta ));
	},

	median : function( alpha, beta ) {
		return Math.pow( 1 - Math.pow( 2, -1 / beta ), 1 / alpha );
	},

	mode : function( alpha, beta ) {
		return ( alpha >= 1 && beta >= 1 && ( alpha !== 1 && beta !== 1 )) ? Math.pow(( alpha - 1 ) / ( alpha * beta - 1 ), 1 / alpha ) : undefined;
	},

	variance: function( alpha, beta ) {
		// TODO: complete this
	}
});



// extend lognormal function with static methods
jStat.extend( jStat.lognormal, {
	pdf : function( x, mu, sigma ) {
		return Math.exp(-Math.log( x ) - 0.5 * Math.log( 2 * Math.PI ) - Math.log( sigma ) - Math.pow( Math.log( x ) - mu, 2 ) / ( 2 * sigma * sigma ));
	},

	cdf : function( x, mu, sigma ) {
		return 0.5 + ( 0.5 * jStat.erf(( Math.log( x ) - mu ) / Math.sqrt( 2 * sigma * sigma )));
	},

	inv : function( p, mu, sigma ) {
		return Math.exp( -1.41421356237309505 * sigma * jStat.erfcinv( 2 * p ) + mu );
	},

	mean : function( mu, sigma ) {
		return Math.exp( mu + sigma * sigma / 2);
	},

	median : function( mu, sigma ) {
		return Math.exp( mu );
	},

	mode : function( mu, sigma ) {
		return Math.exp( mu - sigma * sigma );
	},

	sample : function( mu, sigma ) {
		return Math.exp( jStat.randn() * sigma + mu );
	},

	variance : function( mu, sigma ) {
		return ( Math.exp( sigma * sigma ) - 1 ) * Math.exp( 2 * mu + sigma * sigma );
	}
});



// extend normal function with static methods
jStat.extend( jStat.normal, {
	pdf : function( x, mean, std ) {
		return Math.exp( -0.5 * Math.log( 2 * Math.PI ) - Math.log( std ) - Math.pow( x - mean, 2 ) / ( 2 * std * std ));
	},

	cdf : function( x, mean, std ) {
		return 0.5 * ( 1 + jStat.erf(( x - mean ) / Math.sqrt( 2 * std * std )));
	},

	inv : function( p, mean, std ) {
		return -1.41421356237309505 * std * jStat.erfcinv( 2 * p ) + mean;
	},

	mean : function( mean, std ) {
		return mean;
	},

	median : function( mean, std ) {
		return mean;
	},

	mode : function ( mean, std ) {
		return mean;
	},

	sample : function( mean, std ) {
		return jStat.randn() * std + mean;
	},

	variance : function( mean, std ) {
		return std * std;
	}
});



// extend pareto function with static methods
jStat.extend( jStat.pareto, {
	pdf : function( x, scale, shape ) {
		return ( x > scale ) ? ( shape * Math.pow( scale, shape )) / Math.pow( x, shape + 1 ) : undefined;
	},

	cdf : function( x, scale, shape ) {
		return 1 - Math.pow( scale / x, shape );
	},

	mean : function( scale, shape ) {
		return ( shape > 1 ) ? ( shape * Math.pow( scale, shape )) / ( shape - 1 ) : undefined;
	},

	median : function( scale, shape ) {
		return scale * ( shape * Math.SQRT2 );
	},

	mode : function( scale, shape ) {
		return scale;
	},

	variance : function( scale, shape ) {
		return ( shape > 2 ) ? ( scale*scale * shape ) / ( Math.pow( shape - 1, 2 ) * ( shape - 2 )) : undefined;
	}
});



// extend studentt function with static methods
jStat.extend( jStat.studentt, {
	pdf : function( x, dof ) {
		return ( jStat.gammafn(( dof + 1 ) / 2 ) / ( Math.sqrt( dof * Math.PI ) * jStat.gammafn( dof / 2 ))) * Math.pow( 1 + (( x*x ) / dof ), -(( dof + 1 ) / 2 ));
	},

	cdf : function( x, dof ) {
		var dof2 = dof / 2;
		return jStat.ibeta(( x + Math.sqrt( x * x + dof )) / ( 2 * Math.sqrt( x * x + dof )), dof2, dof2 );
	},

	inv : function( p, dof ) {
		var x = jStat.ibetainv( 2 * Math.min( p, 1 - p ), 0.5 * dof, 0.5 );
		x = Math.sqrt( dof * ( 1 - x ) / x );
		return ( p > 0 ) ? x : -x;
	},

	mean : function( dof ) {
		return ( dof > 1 ) ? 0 : undefined;
	},

	median : function ( dof ) {
		return 0;
	},

	mode : function( dof ) {
		return 0;
	},

	sample : function( dof ) {
		return jStat.randn() * Math.sqrt( dof / ( 2 * jStat.randg( dof / 2)));
	},

	variance : function( dof ) {
		return ( dof  > 2 ) ? dof / ( dof - 2 ) : ( dof > 1 ) ? Infinity : undefined;
	}
});



// extend weibull function with static methods
jStat.extend( jStat.weibull, {
	pdf : function( x, scale, shape ) {
		return x < 0 ? 0 : ( shape / scale ) * Math.pow(( x / scale ),( shape - 1 )) * Math.exp(-( Math.pow(( x / scale ), shape )));
	},

	cdf : function( x, scale, shape ) {
		return x < 0 ? 0 : 1 - Math.exp( -Math.pow(( x / scale ), shape ));
	},

	inv : function( p, scale, shape ) {
		return scale * Math.pow( -Math.log( 1 - p ), 1 / shape );
	},

	mean : function( scale, shape ) {
		return scale * jStat.gammafn( 1 + 1 / shape );
	},

	median : function( scale, shape ) {
		return scale * Math.pow( Math.log( 2 ), 1 / shape );
	},

	mode : function( scale, shape ) {
		return ( shape > 1 ) ? scale * Math.pow(( shape - 1 ) / shape, 1 / shape ) : undefined;
	},

	sample : function( scale, shape ) {
		return scale * Math.pow( -Math.log( Math.random()), 1 / shape );
	},

	variance : function( scale, shape ) {
		return scale * scale * jStat.gammafn( 1 + 2 / shape ) - Math.pow( this.mean( scale, shape ), 2 );
	}
});



// extend uniform function with static methods
jStat.extend( jStat.uniform, {
	pdf : function( x, a, b ) {
		return ( x < a || x > b ) ? 0 : 1 / ( b - a );
	},

	cdf : function( x, a, b ) {
		if ( x < a ) {
			return 0;
		} else if ( x < b ) {
			return ( x - a ) / ( b - a );
		}
		return 1;
	},

	mean : function( a, b ) {
		return 0.5 * ( a + b );
	},

	median : function( a, b ) {
		return jStat.mean( a, b );
	},

	mode : function( a, b ) {
		// TODO: complete this
	},

	sample : function( a, b ) {
		return ( a / 2 + b / 2 ) + ( b / 2 - a / 2) * ( 2 * Math.random() - 1);
	},

	variance : function( a, b ) {
		return Math.pow( b - a, 2 ) / 12;
	}
});



// extend uniform function with static methods
jStat.extend( jStat.binomial, {
	pdf : function( k, n, p ) {
		return ( p === 0 || p === 1 ) ?
			(( n * p ) === k ? 1 : 0 ) :
		jStat.combination( n, k ) * Math.pow( p, k ) * Math.pow( 1 - p, n - k );
	},

	cdf : function( x, n, p ) {
		var binomarr = [],
			k = 0;
		if ( x < 0 ) {
			return 0;
		}
		if ( x < n ) {
			for ( ; k <= x; k++ ) {
				binomarr[ k ] = jStat.binomial.pdf( k, n, p );
			}
			return jStat.sum( binomarr );
		}
		return 1;
	}
});



// extend uniform function with static methods
jStat.extend( jStat.negbin, {
	pdf : function( k, r, p ) {
		return k !== k | 0
			? false
		: k < 0
			? 0
		: jStat.combination( k + r - 1, k ) * Math.pow( 1 - p, r ) * Math.pow( p, k );
	},

	cdf : function( x, r, p ) {
		var sum = 0,
			k = 0;
		if ( x < 0 ) return 0;
		for ( ; k <= x; k++ ) {
			sum += jStat.negbin.pdf( k, r, p );
		}
		return sum;
	}
});



// extend uniform function with static methods
jStat.extend( jStat.hypgeom, {
	pdf : function( k, N, m, n ) {
		return k !== k | 0
			? false
		: ( k < 0)
			? 0
		: jStat.combination( m, k ) * jStat.combination( N - m , n - k ) / jStat.combination( N, n );
	},

	cdf : function( x, N, m, n ) {
		var sum = 0,
			k = 0;
		if ( x < 0 ) return 0;
		for ( ; k <= x; k++ ) {
			sum += jStat.hypgeom.pdf( k, N, m, n );
		}
		return sum;
	}
});



// extend uniform function with static methods
jStat.extend( jStat.poisson, {
	pdf : function( k, l ) {
		return Math.pow( l, k ) * Math.exp( -l ) / jStat.factorial( k );
	},

	cdf : function( x, l ) {
		var sumarr = [],
			k = 0;
		if ( x < 0 ) return 0;
		for ( ; k <= x; k++ ) {
			sumarr.push(jStat.poisson.pdf( k, l ));
		}
		return jStat.sum(sumarr);
	},

	mean : function( l ) {
		return l;
	},

	variance : function( l ) {
		return l;
	},

	sample : function( l ) {
		var p = 1, k = 0, L = Math.exp(-l);
		do {
			k++;
			p *= Math.random();
		} while (p > L);
		return k - 1;
	}
});

// extend triangular function with static methods
jStat.extend( jStat.triangular, {
	pdf : function( x, a, b, c ) {
		return ( b <= a || c < a || c > b )
			? undefined
		: ( x < a || x > b )
			? 0
		: ( x <= c )
			? ( 2 * ( x - a )) / (( b - a ) * ( c - a ))
		: ( 2 * ( b - x )) / (( b - a ) * ( b - c ));
	},

	cdf : function( x, a, b, c ) {
		if ( b <= a || c < a || c > b )
			return undefined;
		if ( x < a ) {
			return 0;
		} else {
			if ( x <= c )
				return Math.pow( x - a, 2 ) / (( b - a ) * ( c - a ));
			return 1 - Math.pow( b - x, 2 ) / (( b - a ) * ( b - c ));
		}
		// never reach this
		return 1;
	},

	mean : function( a, b, c ) {
		return ( a + b + c ) / 3;
	},

	median : function( a, b, c ) {
		if ( c <= ( a + b ) / 2 ) {
			return b - Math.sqrt(( b - a ) * ( b - c )) / Math.sqrt( 2 );
		} else if ( c > ( a + b ) / 2 ) {
			return a + Math.sqrt(( b - a ) * ( c - a )) / Math.sqrt( 2 );
		}
	},

	mode : function( a, b, c ) {
		return c;
	},

	sample : function( a, b, c ) {
		var u = Math.random();
		return u < (( c - a ) / ( b - a )) ?
			a + Math.sqrt( u * ( b - a ) * ( c - a )) : b - Math.sqrt(( 1 - u ) * ( b - a ) * ( b - c ));
	},

	variance : function( a, b, c ) {
		return ( a * a + b * b + c * c - a * b - a * c - b * c ) / 18;
	}
});

})( this.jStat, Math );
/* Provides functions for the solution of linear system of equations, integration, extrapolation,
 * interpolation, eigenvalue problems, differential equations and PCA analysis. */

(function( jStat, Math ) {

var push = Array.prototype.push,
	isArray = jStat.utils.isArray;

jStat.extend({

	// add a vector/matrix to a vector/matrix or scalar
	add : function( arr, arg ) {
		// check if arg is a vector or scalar
		if ( isArray( arg )) {
			if ( !isArray( arg[0] )) arg = [ arg ];
			return jStat.map( arr, function( value, row, col ) { return value + arg[row][col]; });
		}
		return jStat.map( arr, function( value ) { return value + arg; });
	},

	// subtract a vector or scalar from the vector
	subtract : function( arr, arg ) {
		// check if arg is a vector or scalar
		if ( isArray( arg )) {
			if ( !isArray( arg[0] )) arg = [ arg ];
			return jStat.map( arr, function( value, row, col ) { return value - arg[row][col] || 0; });
		}
		return jStat.map( arr, function( value ) { return value - arg; });
	},

	// matrix division
	divide : function( arr, arg ) {
		if ( isArray( arg )) {
			if ( !isArray( arg[0] )) arg = [ arg ];
			return jStat.multiply( arr, jStat.inv( arg ));
		}
		return jStat.map( arr, function( value ) { return value / arg; });
	},

	// matrix multiplication
	multiply : function( arr, arg ) {
		var row, col, nrescols, sum,
			nrow = arr.length,
			ncol = arr[0].length,
			res = jStat.zeros( nrow, nrescols = ( isArray( arg )) ? arg[0].length : ncol ),
			rescols = 0;
		if ( isArray( arg )) {
			for ( ; rescols < nrescols; rescols++ ) {
				for ( row = 0; row < nrow; row++ ) {
					sum = 0;
					for ( col = 0; col < ncol; col++ )
						sum += arr[row][col] * arg[col][rescols];
					res[row][rescols] = sum;
				}
			}
			return ( nrow === 1 && rescols === 1 ) ? res[0][0] : res;
		}
		return jStat.map( arr, function( value ) { return value * arg; });
	},

	// Returns the dot product of two matricies
	dot : function( arr, arg ) {
		if ( !isArray( arr[0] )) arr = [ arr ];
		if ( !isArray( arg[0] )) arg = [ arg ];
			// convert column to row vector
		var left = ( arr[0].length === 1 && arr.length !== 1 ) ? jStat.transpose( arr ) : arr,
			right = ( arg[0].length === 1 && arg.length !== 1 ) ? jStat.transpose( arg ) : arg,
			res = [],
			row = 0,
			nrow = left.length,
			ncol = left[0].length,
			sum, col;
		for ( ; row < nrow; row++ ) {
			res[row] = [];
			sum = 0;
			for ( col = 0; col < ncol; col++ )
				sum += left[row][col] * right[row][col];
			res[row] = sum;
		}
		return ( res.length === 1 ) ? res[0] : res;
	},

	// raise every element by a scalar
	pow : function( arr, arg ) {
		return jStat.map( arr, function( value ) { return Math.pow( value, arg ); });
	},

	// generate the absolute values of the vector
	abs : function( arr ) {
		return jStat.map( arr, function( value ) { return Math.abs( value ); });
	},

	// TODO: make compatible with matrices
	// computes the p-norm of the vector
	norm : function( arr, p ) {
		var nnorm = 0,
			i = 0;
		// check the p-value of the norm, and set for most common case
		if ( isNaN( p )) p = 2;
		// check if multi-dimensional array, and make vector correction
		if ( isArray( arr[0] )) arr = arr[0];
		// vector norm
		for (; i < arr.length; i++ ) {
			nnorm += Math.pow( Math.abs( arr[i] ), p );
		}
		return Math.pow( nnorm, 1 / p );
	},

	// TODO: make compatible with matrices
	// computes the angle between two vectors in rads
	angle : function( arr, arg ) {
		return Math.acos( jStat.dot( arr, arg ) / ( jStat.norm( arr ) * jStat.norm( arg )));
	},

	// augment one matrix by another
	aug : function( a, b ) {
		var newarr = a.slice(),
			i = 0;
		for ( ; i < newarr.length; i++ ) {
			push.apply( newarr[i], b[i] );
		}
		return newarr;
	},

	inv : function( a ) {
		var rows = a.length,
			cols = a[0].length,
			b = jStat.identity( rows, cols ),
			c = jStat.gauss_jordan( a, b ),
			obj = [],
			i = 0,
			j;
		for ( ; i < rows; i++ ) {
			obj[i] = [];
			for ( j = cols - 1; j < c[0].length; j++ )
				obj[i][j - cols] = c[i][j];
		}
		return obj;
	},

	// calculate the determinant of a matrix
	det : function( a ) {
		var alen = a.length,
			alend = alen * 2,
			vals = new Array( alend ),
			rowshift = alen - 1,
			colshift = alend - 1,
			mrow = rowshift - alen + 1,
			mcol = colshift,
			i = 0,
			result = 0,
			j;
		// check for special 2x2 case
		if ( alen === 2 ) {
			return a[0][0] * a[1][1] - a[0][1] * a[1][0];
		}
		for (; i < alend; i++ ) {
			vals[i] = 1;
		}
		for ( i = 0; i < alen; i++ ) {
			for ( j = 0; j < alen; j++ ) {
				vals[( mrow < 0 ) ? mrow + alen : mrow ] *= a[i][j];
				vals[( mcol < alen ) ? mcol + alen : mcol ] *= a[i][j];
				mrow++;
				mcol--;
			}
			mrow = --rowshift - alen + 1;
			mcol = --colshift;
		}
		for ( i = 0; i < alen; i++ ) {
			result += vals[i];
		}
		for (; i < alend; i++ ) {
			result -= vals[i];
		}
		return result;
	},

	gauss_elimination : function( a, b ) {
		var i = 0,
			j = 0,
			n = a.length,
			m = a[0].length,
			factor = 1,
			sum = 0,
			x = [],
			maug, pivot, temp, k;
		a = jStat.aug( a, b );
		maug = a[0].length;
		for( ; i < n; i++ ) {
			pivot = a[i][i];
			j = i;
			for ( k = i + 1; k < m; k++ ) {
				if ( pivot < Math.abs( a[k][i] )) {
					pivot = a[k][i];
					j = k;
				}
			}
			if ( j != i ) {
				for( k = 0; k < maug; k++ ) {
					temp = a[i][k];
					a[i][k] = a[j][k];
					a[j][k] = temp;
				}
			}
			for ( j = i + 1; j < n; j++ ) {
				factor = a[j][i] / a[i][i];
				for( k = i; k < maug; k++) {
					a[j][k] = a[j][k] - factor * a[i][k];
				}
			}
		}
		for ( i = n - 1; i >= 0; i-- ) {
			sum = 0;
			for ( j = i + 1; j<= n - 1; j++ ) {
				sum = x[j] * a[i][j];
			}
			x[i] =( a[i][maug - 1] - sum ) / a[i][i];
		}
		return x;
	},

	gauss_jordan : function(a, b) {
		var m = jStat.aug(a, b),
			h = m.length,
			w = m[0].length;
		// find max pivot
		for (var y = 0; y < h; y++) {
			var maxrow = y;
			for (var y2 = y+1; y2 < h; y2++) {
				if (Math.abs(m[y2][y]) > Math.abs(m[maxrow][y]))
					maxrow = y2;
			}
			var tmp = m[y];
			m[y] = m[maxrow];
			m[maxrow] = tmp
			for (var y2 = y+1; y2 < h; y2++) {
				c = m[y2][y] / m[y][y];
				for (var x = y; x < w; x++) {
					m[y2][x] -= m[y][x] * c;
				}
			}
		}
		// backsubstitute
		for (var y = h-1; y >= 0; y--) {
			c = m[y][y];
			for (var y2 = 0; y2 < y; y2++) {
				for (var x = w-1; x > y-1; x--) {
					m[y2][x] -= m[y][x] * m[y2][y] / c;
				}
			}
			m[y][y] /= c;
			for (var x = h; x < w; x++) {
				m[y][x] /= c;
			}
		}
		return m;
	},

	lu : function( a, b ) {
		//TODO
	},

	cholesky : function( a, b ) {
		//TODO
	},

	gauss_jacobi : function( a, b, x, r ) {
		var i = 0,
			j = 0,
			n = a.length,
			l = [],
			u = [],
			d = [],
			xv, c, h, xk;
		for ( ; i < n; i++ ) {
			l[i] = [];
			u[i] = [];
			d[i] = [];
			for ( j = 0; j < n; j++ ) {
				if ( i > j ) {
					l[i][j] = a[i][j];
					u[i][j] = d[i][j] = 0;
				} else if ( i < j ) {
					u[i][j] = a[i][j];
					l[i][j] = d[i][j] = 0;
				} else {
					d[i][j] = a[i][j];
					l[i][j] = u[i][j] = 0;
				}
			}
		}
		h = jStat.multiply( jStat.multiply( jStat.inv( d ), jStat.add( l, u )), -1 );
		c = jStat.multiply( jStat.inv( d ), b );
		xv = x;
		xk = jStat.add( jStat.multiply( h, x ), c );
		i = 2;
		while ( Math.abs( jStat.norm( jStat.subtract( xk,xv ))) > r ) {
			xv = xk;
			xk = jStat.add( jStat.multiply( h, xv ), c );
			i++;
		}
		return xk;
	},

	gauss_seidel : function( a, b, x, r ) {
		var i = 0,
			n = a.length,
			l = [],
			u = [],
			d = [],
			j, xv, c, h, xk;
		for ( ; i < n; i++ ) {
			l[i] = [];
			u[i] = [];
			d[i] = [];
			for ( j = 0; j < n; j++) {
				if ( i > j ) {
					l[i][j] = a[i][j];
					u[i][j] = d[i][j] = 0;
				} else if ( i < j ) {
					u[i][j] = a[i][j];
					l[i][j] = d[i][j] = 0;
				} else {
					d[i][j] = a[i][j];
					l[i][j] = u[i][j] = 0;
				}
			}
		}
		h = jStat.multiply( jStat.multiply( jStat.inv( jStat.add( d, l )), u ), -1 );
		c = jStat.multiply( jStat.inv( jStat.add( d, l )), b );
		xv = x;
		xk = jStat.add( jStat.multiply( h, x ), c );
		i = 2;
		while ( Math.abs( jStat.norm( jStat.subtract( xk, xv ))) > r ) {
			xv = xk;
			xk = jStat.add( jStat.multiply( h, xv ), c );
			i = i + 1;
		}
		return xk;
	},

	SOR : function( a, b, x, r, w ) {
		var i = 0,
			n = a.length,
			l = [],
			u = [],
			d = [],
			j, xv, c, h, xk;
		for ( ; i < n; i++ ) {
			l[i] = [];
			u[i] = [];
			d[i] = [];
			for ( j = 0; j < n; j++ ) {
				if ( i > j ) {
					l[i][j] = a[i][j];
					u[i][j] = d[i][j] = 0;
				} else if ( i < j ) {
					u[i][j] = a[i][j];
					l[i][j] = d[i][j] = 0;
				} else {
					d[i][j] = a[i][j];
					l[i][j] = u[i][j] = 0;
				}
			}
		}
		h = jStat.multiply( jStat.inv( jStat.add( d, jStat.multiply( l, w ))), jStat.subtract( jStat.multiply( d, 1 - w ), jStat.multiply( u, w )));
		c = jStat.multiply( jStat.multiply( jStat.inv( jStat.add( d, jStat.multiply( l, w ))), b ), w );
		xv = x;
		xk = jStat.add( jStat.multiply( h, x ), c );
		i = 2;
		while ( Math.abs( jStat.norm( jStat.subtract( xk, xv ))) > r ) {
			xv = xk;
			xk = jStat.add( jStat.multiply( h, xv ), c );
			i++;
		}
		return xk;
	},

	householder : function( a ) {
		var m = a.length,
			n = a[0].length,
			i = 0,
			w = [],
			p = [],
			alpha, r, k, j, factor;
		for ( ; i < m - 1; i++ ) {
			alpha = 0;
			for ( j = i + 1; j < n; j++ )
				alpha += ( a[j][i] * a[j][i] );
			factor = ( a[i + 1][i] > 0 ) ? -1 : 1;
			alpha = factor * Math.sqrt( alpha );
			r = Math.sqrt(((( alpha * alpha ) - a[i + 1][i] * alpha ) / 2 ));
			w = jStat.zeros( m, 1 );
			w[i + 1][0] = ( a[i + 1][i] - alpha ) / ( 2 * r );
			for ( k = i + 2; k < m; k++ ) w[k][0] = a[k][i] / ( 2 * r );
			p = jStat.subtract( jStat.identity( m, n ), jStat.multiply( jStat.multiply(w, jStat.transpose( w )), 2 ));
			a = jStat.multiply( p, jStat.multiply( a, p ));
		}
		return a;
	},

	// TODO: not working properly.
	QR : function( a, b ) {
		var m = a.length,
			n = a[0].length,
			i = 0,
			w = [],
			p = [],
			x = [],
			j, alpha, r, k, factor,sum;
		for ( ; i < m - 1; i++ ) {
			alpha = 0;
			for ( j = i + 1; j < n; j++ )
				alpha += ( a[j][i] * a[j][i] );
			factor = ( a[i + 1][i] > 0 ) ? -1 : 1;
			alpha = factor * Math.sqrt( alpha );
			r = Math.sqrt(((( alpha * alpha ) - a[i + 1][i] * alpha ) / 2 ));
			w = jStat.zeros( m, 1 );
			w[i + 1][0] = ( a[i + 1][i] - alpha ) / ( 2 * r );
			for ( k = i + 2; k < m; k++ ) w[k][0] = a[k][i] / ( 2 * r );
			p = jStat.subtract( jStat.identity( m, n ), jStat.multiply( jStat.multiply( w, jStat.transpose( w )), 2));
			a = jStat.multiply( p, a );
			b = jStat.multiply( p, b );
		}
		for ( i = m - 1; i >= 0; i-- ) {
			sum = 0;
			for ( j = i + 1; j <= n - 1; j++ )
				sum = x[j] * a[i][j];
			x[i] = b[i][0] / a[i][i];
		}
		return x;
	},

	jacobi : function( a ) {
		var condition = 1,
			count = 0,
			n = a.length,
			e = jStat.identity( n, n ),
			ev = [],
			b, i, j, p, q, maxim, theta, s;
		// condition === 1 only if tolerance is not reached
		while ( condition === 1 ) {
			count++;
			maxim = a[0][1];
			p = 0;
			q = 1;
			for ( i = 0; i < n; i++ ) {
				for ( j = 0; j < n; j++ ) {
					if ( i != j ) {
						if ( maxim < Math.abs( a[i][j] )) {
							maxim = Math.abs( a[i][j] );
							p = i;
							q = j;
						}
					}
				}
			}
			if ( a[p][p] === a[q][q] )
				theta = ( a[p][q] > 0 ) ? Math.PI / 4 : -Math.PI / 4;
			else
				theta = Math.atan( 2 * a[p][q] / ( a[p][p] - a[q][q] )) / 2;
			s = jStat.identity( n, n );
			s[p][p] = Math.cos( theta );
			s[p][q] = -Math.sin( theta );
			s[q][p] = Math.sin( theta );
			s[q][q] = Math.cos( theta );
			// eigen vector matrix
			e = jStat.multiply( e, s );
			b = jStat.multiply( jStat.multiply( jStat.inv( s ), a ), s );
			a = b;
			condition = 0;
			for ( i = 1; i < n; i++ ) {
				for ( j = 1; j < n; j++ ) {
					if ( i != j && Math.abs( a[i][j]) > 0.001 ) {
						condition = 1;
					}
				}
			}
		}
		for( i = 0; i < n; i++ ) ev.push( a[i][i] );
		//returns both the eigenvalue and eigenmatrix
		return [e, ev];
	},

	rungekutta : function( f, h, p, t_j, u_j, order ) {
		var k1, k2, u_j1, k3, k4;
		if ( order === 2 ) {
			while ( t_j <= p ) {
				k1 = h * f( t_j, u_j );
				k2 = h * f( t_j + h, u_j + k1 );
				u_j1 = u_j + ( k1 + k2 ) / 2;
				u_j = u_j1;
				t_j = t_j + h;
			}
		}
		if ( order === 4 ) {
			while ( t_j <= p ) {
				k1 = h * f( t_j, u_j);
				k2 = h * f( t_j + h / 2, u_j + k1 / 2 );
				k3 = h * f( t_j + h / 2, u_j + k2 / 2);
				k4 = h * f( t_j +h, u_j + k3 );
				u_j1 = u_j + ( k1 + 2 * k2 + 2 * k3 + k4 ) / 6;
				u_j = u_j1;
				t_j = t_j + h;
			}
		}
		return u_j;
	},

	romberg : function( f, a, b, order ) {
		var i = 0,
			h = ( b - a ) / 2,
			x = [],
			h1 = [],
			g = [],
			m, a1, j, k, I, d;
		while ( i < order / 2 ) {
			I = f( a );
			for ( j = a, k = 0; j <= b; j = j + h, k++ ) x[k] = j;
			m = x.length;
			for ( j = 1; j < m - 1; j++ ) {
				I += ((( j % 2 ) !== 0 ) ? 4 : 2 ) * f( x[j] );
			}
			I = ( h / 3 ) * ( I + f( b ));
			g[i] = I;
			h /= 2;
			i++;
		}
		a1 = g.length;
		m = 1;
		while ( a1 !== 1 ) {
			for ( j = 0; j < a1 - 1; j++ )
				h1[j] = (( Math.pow( 4, m )) * g[j + 1] - g[j] ) / ( Math.pow( 4, m ) - 1 );
			a1 = h1.length;
			g = h1;
			h1 = [];
			m++;
		}
		return g;
	},

	richardson : function( X, f, x, h ) {
		function pos( X, x ) {
			var i = 0,
				n = X.length,
				p;
			for ( ; i < n; i++ )
				if ( X[i] === x ) p = i;
			return p;
		}
		var n = X.length,
			h_min = Math.abs( x - X[pos( X, x ) + 1] ),
			i = 0,
			g = [],
			h1 = [],
			y1, y2, m, a, j;
		while ( h >= h_min ) {
			y1 = pos( X, x + h );
			y2 = pos( X, x );
			g[i] = ( f[y1] - 2 * f[y2] + f[2 * y2 - y1]) / ( h * h );
			h /= 2;
			i++;
		}
		a = g.length;
		m = 1;
		while ( a != 1 ) {
			for ( j = 0; j < a - 1; j++ )
				h1[j] = (( Math.pow( 4, m )) * g[j + 1] - g[j]) / ( Math.pow( 4, m ) - 1 );
			a = h1.length;
			g = h1;
			h1 = [];
			m++;
		}
		return g;
	},

	simpson : function( f, a, b, n ) {
		var h = ( b - a ) / n,
			I = f( a ),
			x = [],
			j = a,
			k = 0,
			i = 1,
			m;
		for ( ; j <= b; j = j + h, k++ )
			x[k] = j;
		m = x.length;
		for ( ; i < m - 1; i++ ) {
			I += (( i % 2 !== 0 ) ? 4 : 2 ) * f( x[i] );
		}
		return ( h / 3 ) * ( I + f( b ));
	},

	hermite : function( X, F, dF, value ) {
		var n = X.length,
			p = 0,
			i = 0,
			l = [],
			dl = [],
			A = [],
			B = [],
			j;
		for ( ; i < n; i++) {
			l[i] = 1;
			for ( j = 0; j < n; j++ ) {
				if ( i != j ) l[i] *= ( value - X[j] ) / ( X[i] - X[j] );
			}
			dl[i] = 0;
			for ( j = 0; j < n; j++ ) {
				if ( i != j ) dl[i] += 1 / (X [i] - X[j] );
			}
			A[i] = ( 1 - 2 * ( value - X[i] ) * dl[i] ) * ( l[i] * l[i] );
			B[i] = ( value - X[i] ) * ( l[i] * l[i] );
			p += ( A[i] * F[i] + B[i] * dF[i] );
		}
		return p;
	},

	lagrange : function( X, F, value ) {
		var p = 0,
			i = 0,
			j, l,
		n = X.length;
		for ( ; i < n; i++ ) {
			l = F[i];
			for ( j = 0; j < n; j++ ) {
				// calculating the lagrange polynomial L_i
				if ( i != j ) l *= ( value - X[j] ) / ( X[i] - X[j] );
			}
			// adding the lagrange polynomials found above
			p += l;
		}
		return p;
	},

	cubic_spline : function( X, F, value ) {
		var n = X.length,
			i = 0, j,
			A = [],
			B = [],
			alpha = [],
			c = [],
			h = [],
			b = [],
			d = [];
		for ( ; i < n - 1; i++ )
			h[i] = X[i + 1] - X[i];
		alpha[0] = 0;
		for ( i = 1; i < n - 1; i++ )
			alpha[i] = ( 3 / h[i] ) * ( F[i + 1] - F[i] ) - ( 3 / h[i-1] ) * ( F[i] - F[i-1] );
		for ( i = 1; i < n - 1; i++ ) {
			A[i] = [];
			B[i] = [];
			A[i][i-1] = h[i-1];
			A[i][i] = 2 * ( h[i - 1] + h[i] );
			A[i][i+1] = h[i];
			B[i][0] = alpha[i];
		}
		c = jStat.multiply( jStat.inv( A ), B );
		for ( j = 0; j < n - 1; j++ ) {
			b[j] = ( F[j + 1] - F[j] ) / h[j] - h[j] * ( c[j + 1][0] + 2 * c[j][0] ) / 3;
			d[j] = ( c[j + 1][0] - c[j][0] ) / ( 3 * h[j] );
		}
		for ( j = 0; j < n; j++ ) {
			if ( X[j] > value ) break;
		}
		j -= 1;
		return F[j] + ( value - X[j] ) * b[j] + jStat.sq( value-X[j] ) * c[j] + ( value - X[j] ) * jStat.sq( value - X[j] ) * d[j];
	},

	gauss_quadrature : function() {
		//TODO
	},

	PCA : function( X ) {
		var m = X.length,
			n = X[0].length,
			flag = false,
			i = 0,
			j, temp1,
			u = [],
			D = [],
			result = [],
			temp2 = [],
			Y = [],
			Bt = [],
			B = [],
			C = [],
			V = [],
			Vt = [];
		for ( i = 0; i < m; i++ ) {
			u[i] = jStat.sum( X[i] ) / n;
		}
		for ( i = 0; i < n; i++ ) {
			B[i] = [];
			for( j = 0; j < m; j++ ) {
				B[i][j] = X[j][i] - u[j];
			}
		}
		B = jStat.transpose( B );
		for ( i = 0; i < m; i++ ) {
			C[i] = [];
			for ( j = 0; j < m; j++ ) {
				C[i][j] = ( jStat.dot( [B[i]], [B[j]] )) / ( n - 1 );
			}
		}
		result = jStat.jacobi( C );
		V = result[0];
		D = result[1];
		Vt = jStat.transpose( V );
		for ( i = 0; i < D.length; i++ ) {
			for ( j = i; j < D.length; j++ ) {
				if( D[i] < D[j] )  {
					temp1 = D[i];
					D[i] = D[j];
					D[j] = temp1;
					temp2 = Vt[i];
					Vt[i] = Vt[j];
					Vt[j] = temp2;
				}
			}
		}
		Bt = jStat.transpose( B );
		for ( i = 0; i < m; i++ ) {
			Y[i] = [];
			for ( j = 0; j < Bt.length; j++ ) {
				Y[i][j] = jStat.dot( [Vt[i]], [Bt[j]] );
			}
		}
		return [X, D, Vt, Y];
	}
});

// extend jStat.fn with methods that require one argument
(function( funcs ) {
	for ( var i = 0; i < funcs.length; i++ ) (function( passfunc ) {
		jStat.fn[ passfunc ] = function( arg, func ) {
			var tmpthis = this;
			// check for callback
			if ( func ) {
				setTimeout( function() {
					func.call( tmpthis, jStat.fn[ passfunc ].call( tmpthis, arg ));
				}, 15 );
				return this;
			}
			return jStat( jStat[ passfunc ]( this, arg ));
		};
	}( funcs[i] ));
}( 'add divide multiply subtract dot pow abs norm angle'.split( ' ' )));

}( this.jStat, Math ));
(function( jStat, Math ) {

var slice = [].slice,
	isNumber = jStat.utils.isNumber;

// flag==true denotes use of sample standard deviation
// Z Statistics
jStat.extend({
	// 2 different parameter lists:
	// ( value, mean, sd )
	// ( value, array, flag )
	zscore : function() {
		var args = slice.call( arguments );
		if ( isNumber( args[1] )) {
			return ( args[0] - args[1] ) / args[2];
		}
		return ( args[0] - jStat.mean( args[1] )) / jStat.stdev( args[1], args[2] );
	},

	// 3 different paramter lists:
	// ( value, mean, sd, sides )
	// ( zscore, sides )
	// ( value, array, sides, flag )
	ztest : function() {
		var args = slice.call( arguments );
		if ( args.length === 4 ) {
			if( isNumber( args[1] )) {
				return ( args[3] === 1 ) ?
					(1-jStat.normal.cdf( Math.abs( args[0] ), args[1], args[2] )) :
				( 2 *  jStat.normal.cdf( Math.abs( args[0] ), args[1], args[2] )- 2);
			}
			return ( args[2] === 1 ) ?
				( 1 - jStat.normal.cdf( Math.abs( args[0] ), jStat.mean( args[1] ), jStat.stdev( args[1],args[3] ))) :
			( 2 * jStat.normal.cdf( Math.abs( args[0] ), jStat.mean( args[1] ), jStat.stdev( args[1],args[3] ))-2);
		}
		return ( args[1] === 1 ) ?
			( 1 - jStat.normal.cdf( Math.abs( args[0] ), 0, 1 )) :
		( 2 * jStat.normal.cdf( Math.abs( args[0] ), 0, 1 )-2);
	}
});

jStat.extend( jStat.fn, {
	zscore : function( value, flag ) {
		return ( value - this.mean()) / this.stdev( flag );
	},

	ztest : function( value, sides, flag ) {
		var zscore = Math.abs( this.zscore( value, flag ));
		return ( sides === 1 ) ?
			( 1 - jStat.normal.cdf( zscore, 0, 1 )) :
		(2 * jStat.normal.cdf( zscore, 0, 1 ) -2);
	}
});

// T Statistics
jStat.extend({
	// 2 parameter lists
	// ( value, mean, sd, n )
	// ( value, array )
	tscore : function() {
		var args = slice.call( arguments );
		return ( args.length === 4 ) ?
			(( args[0] - args[1] ) / ( args[2] / Math.sqrt( args[3] ))) :
		(( args[0] - jStat.mean( args[1] )) / ( jStat.stdev( args[1], true ) / Math.sqrt( args[1].length )));
	},

	// 3 different paramter lists:
	// ( value, mean, sd, n, sides )
	// ( tscore, n, sides )
	// ( value, array, sides )
	ttest : function() {
		var args = slice.call( arguments );
		var tscore;
		if ( args.length === 5 ) {
			tscore = Math.abs( jStat.tscore( args[0], args[1], args[2], args[3] ));
			return ( args[4] === 1 ) ?
				( 1 - jStat.studentt.cdf( tscore, args[3] )) :
			( 2 * jStat.studentt.cdf( tscore, args[3])-2);
		}
		if ( isNumber( args[1] )) {
			tscore = Math.abs( args[0] )
			return ( args[2] == 1 ) ?
				( 1 - jStat.studentt.cdf( tscore, args[1])) :
			( 2 * jStat.studentt.cdf( tscore, args[1])-2);
		}
		tscore = Math.abs( jStat.tscore( args[0], args[1] ))
		return ( args[2] == 1 ) ?
			( 1 - jStat.studentt.cdf( tscore, args[1].length-1)) :
		( 2 * jStat.studentt.cdf( tscore, args[1].length-1)-2);
	}
});

jStat.extend( jStat.fn, {
	tscore : function( value ) {
		return ( value - this.mean()) / ( this.stdev( true ) / Math.sqrt( this.cols()));
	},

	ttest : function( value, sides ) {
		return ( sides === 1 ) ?
			( 1 - jStat.studentt.cdf( Math.abs( this.tscore(value)), this.cols()-1)) :
		( 2 * jStat.studentt.cdf( Math.abs( this.tscore(value)), this.cols()-1)-2);
	}
});

// F Statistics
jStat.extend({
	// Paramter list is as follows:
	// ( array1, array2, array3, ... )
	// or it is an array of arrays
	// array of arrays conversion
	anovafscore : function() {
		var args = slice.call( arguments ),
			expVar, sample, sampMean, sampSampMean, tmpargs, unexpVar, i, j;
		if ( args.length === 1 ) {
			tmpargs = new Array( args[0].length );
			for ( i = 0; i < args[0].length; i++ ) {
				tmpargs[i] = args[0][i];
			}
			args = tmpargs;
		}
		// 2 sample case
		if ( args.length === 2 ) {
			return jStat.variance( args[0] ) / jStat.variance( args[1] );
		}
		// Builds sample array
		sample = new Array();
		for ( i = 0; i < args.length; i++ ) {
			sample = sample.concat( args[i] );
		}	
		sampMean = jStat.mean( sample );
		// Computes the explained variance
		expVar = 0;
		for ( i = 0; i < args.length; i++ ) {
			expVar = expVar + args[i].length * Math.pow( jStat.mean( args[i] ) - sampMean, 2 );
		}
		expVar /= ( args.length - 1 );
		// Computes unexplained variance
		unexpVar = 0;
		for ( i = 0; i < args.length; i++ ) {
			sampSampMean = jStat.mean( args[i] );
			for ( j = 0; j < args[i].length; j++ ) {
				unexpVar += Math.pow( args[i][j] - sampSampMean, 2 );
			}
		}
		unexpVar /= ( sample.length - args.length );
		return expVar / unexpVar;
	},

	// 2 different paramter setups
	// ( array1, array2, array3, ... )
	// ( anovafscore, df1, df2 )
	anovaftest : function() {
		var args = slice.call( arguments ),
			df1, df2, n, i;
		if ( isNumber( args[0] )) {
			return 1 - jStat.centralF.cdf( args[0], args[1], args[2] );
		}
		anovafscore = jStat.anovafscore( args );
		df1 = args.length - 1;
		n = 0;
		for ( i = 0; i < args.length; i++ ) {
			n = n + args[i].length;
		}
		df2 = n - df1 - 1;
		return 1 - jStat.centralF.cdf( anovafscore, df1, df2 );
	},

	ftest : function( fscore, df1, df2 ) {
		return 1 - jStat.centralF.cdf( fscore, df1, df2 );
	}
});

jStat.extend( jStat.fn, {
	anovafscore : function() {
		return jStat.anovafscore( this.toArray());
	},

	anovaftest: function() {
		var n = 0,
			i;
		for ( i = 0; i < this.length; i++ ) {
			n = n + this[i].length;
		}
		return jStat.ftest( this.anovafscore(), this.length - 1, n - this.length );
	}
});

// Error Bounds
jStat.extend({
	// 2 different parameter setups
	// ( value, alpha, sd, n )
	// ( value, alpha, array )
	normalci : function() {
		var args = slice.call( arguments ),
			ans = new Array(2),
			change;
		if ( args.length === 4 ) {
			change = Math.abs( jStat.normal.inv( args[1] / 2, 0, 1 ) * args[2] / Math.sqrt( args[3] ));
		} else {
			change = Math.abs( jStat.normal.inv( args[1] / 2, 0, 1 ) * jStat.stdev( args[2] ) / Math.sqrt( args[2].length ));
		}
		ans[0] = args[0] - change;
		ans[1] = args[0] + change;
		return ans;
	},

	// 2 different parameter setups
	// ( value, alpha, sd, n )
	// ( value, alpha, array )
	tci : function() {
		var args = slice.call( arguments ),
			ans = new Array(2),
			change;
		if ( args.length === 4 ) {
			change = Math.abs( jStat.studentt.inv( args[1] / 2, args[3] - 1 ) * args[2] / Math.sqrt( args[3] ));
		} else {
			change = Math.abs( jStat.studentt.inv( args[1] / 2, args[2].length ) * jStat.stdev( args[2], true ) / Math.sqrt( args[2].length ));
		}
		ans[0] = args[0] - change;
		ans[1] = args[0] + change;
		return ans;
	},

	significant : function( pvalue, alpha ) {
		return pvalue < alpha;
	}
});

jStat.extend( jStat.fn, {
	normalci : function( value, alpha ) {
		return jStat.normalci( value, alpha, this.toArray());
	},

	tci : function( value, alpha ) {
		return jStat.tci( value, alpha, this.toArray());
	}
});

}( this.jStat, Math ));

},{}],3:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * @license
 * Lo-Dash 1.2.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.4.4 <http://underscorejs.org/>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * Available under MIT license <http://lodash.com/license>
 */
;(function(window) {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Detect free variable `exports` */
  var freeExports = typeof exports == 'object' && exports;

  /** Detect free variable `module` */
  var freeModule = typeof module == 'object' && module && module.exports == freeExports && module;

  /** Detect free variable `global`, from Node.js or Browserified code, and use it as `window` */
  var freeGlobal = typeof global == 'object' && global;
  if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
    window = freeGlobal;
  }

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used internally to indicate various things */
  var indicatorObject = {};

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 200;

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to match HTML characters */
  var reUnescapedHtml = /[&<>"']/g;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object', 'RegExp',
    'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN', 'parseInt',
    'setImmediate', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given `context` object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=window] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.com/#x11.1.5.
    context = context ? _.defaults(window.Object(), context, _.pick(window, contextProps)) : window;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for `Array` and `Object` method references */
    var arrayRef = Array(),
        objectRef = Object();

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(objectRef.valueOf)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        concat = arrayRef.concat,
        floor = Math.floor,
        getPrototypeOf = reNative.test(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectRef.hasOwnProperty,
        push = arrayRef.push,
        setImmediate = context.setImmediate,
        setTimeout = context.setTimeout,
        toString = objectRef.toString;

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,
        nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random,
        nativeSlice = arrayRef.slice;

    /** Detect various environments */
    var isIeOpera = reNative.test(context.attachEvent),
        isV8 = nativeBind && !/\n|true/.test(nativeBind + isIeOpera);

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object, which wraps the given `value`, to enable method
     * chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `createCallback`, `debounce`, `defaults`,
     * `defer`, `delay`, `difference`, `filter`, `flatten`, `forEach`, `forIn`,
     * `forOwn`, `functions`, `groupBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `push`, `range`,
     * `reject`, `rest`, `reverse`, `shuffle`, `slice`, `sort`, `sortBy`, `splice`,
     * `tap`, `throttle`, `times`, `toArray`, `union`, `uniq`, `unshift`, `unzip`,
     * `values`, `where`, `without`, `wrap`, and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `has`,
     * `identity`, `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`,
     * `isElement`, `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`,
     * `isNull`, `isNumber`, `isObject`, `isPlainObject`, `isRegExp`, `isString`,
     * `isUndefined`, `join`, `lastIndexOf`, `mixin`, `noConflict`, `parseInt`,
     * `pop`, `random`, `reduce`, `reduceRight`, `result`, `shift`, `size`, `some`,
     * `sortedIndex`, `runInContext`, `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * passed, otherwise they return unwrapped values.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {Mixed} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if `Function#bind` exists and is inferred to be fast (all but V8).
     *
     * @memberOf _.support
     * @type Boolean
     */
    support.fastBind = nativeBind && !isV8;

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type String
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function optimized to search large arrays for a given `value`,
     * starting at `fromIndex`, using strict equality for comparisons, i.e. `===`.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {Mixed} value The value to search for.
     * @returns {Boolean} Returns `true`, if `value` is found, else `false`.
     */
    function cachedContains(array) {
      var length = array.length,
          isLarge = length >= largeArraySize;

      if (isLarge) {
        var cache = {},
            index = -1;

        while (++index < length) {
          var key = keyPrefix + array[index];
          (cache[key] || (cache[key] = [])).push(array[index]);
        }
      }
      return function(value) {
        if (isLarge) {
          var key = keyPrefix + value;
          return  cache[key] && indexOf(cache[key], value) > -1;
        }
        return indexOf(array, value) > -1;
      }
    }

    /**
     * Used by `_.max` and `_.min` as the default `callback` when a given
     * `collection` is a string value.
     *
     * @private
     * @param {String} value The character to inspect.
     * @returns {Number} Returns the code unit of given character.
     */
    function charAtCallback(value) {
      return value.charCodeAt(0);
    }

    /**
     * Used by `sortBy` to compare transformed `collection` values, stable sorting
     * them in ascending order.
     *
     * @private
     * @param {Object} a The object to compare to `b`.
     * @param {Object} b The object to compare to `a`.
     * @returns {Number} Returns the sort order indicator of `1` or `-1`.
     */
    function compareAscending(a, b) {
      var ai = a.index,
          bi = b.index;

      a = a.criteria;
      b = b.criteria;

      // ensure a stable sort in V8 and other engines
      // http://code.google.com/p/v8/issues/detail?id=90
      if (a !== b) {
        if (a > b || typeof a == 'undefined') {
          return 1;
        }
        if (a < b || typeof b == 'undefined') {
          return -1;
        }
      }
      return ai < bi ? -1 : 1;
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this` binding
     * of `thisArg` and prepends any `partialArgs` to the arguments passed to the
     * bound function.
     *
     * @private
     * @param {Function|String} func The function to bind or the method name.
     * @param {Mixed} [thisArg] The `this` binding of `func`.
     * @param {Array} partialArgs An array of arguments to be partially applied.
     * @param {Object} [idicator] Used to indicate binding by key or partially
     *  applying arguments from the right.
     * @returns {Function} Returns the new bound function.
     */
    function createBound(func, thisArg, partialArgs, indicator) {
      var isFunc = isFunction(func),
          isPartial = !partialArgs,
          key = thisArg;

      // juggle arguments
      if (isPartial) {
        var rightIndicator = indicator;
        partialArgs = thisArg;
      }
      else if (!isFunc) {
        if (!indicator) {
          throw new TypeError;
        }
        thisArg = func;
      }

      function bound() {
        // `Function#bind` spec
        // http://es5.github.com/#x15.3.4.5
        var args = arguments,
            thisBinding = isPartial ? this : thisArg;

        if (!isFunc) {
          func = thisArg[key];
        }
        if (partialArgs.length) {
          args = args.length
            ? (args = nativeSlice.call(args), rightIndicator ? args.concat(partialArgs) : partialArgs.concat(args))
            : partialArgs;
        }
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          noop.prototype = func.prototype;
          thisBinding = new noop;
          noop.prototype = null;

          // mimic the constructor's `return` behavior
          // http://es5.github.com/#x13.2.2
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      return bound;
    }

    /**
     * Used by `template` to escape characters for inclusion in compiled
     * string literals.
     *
     * @private
     * @param {String} match The matched character to escape.
     * @returns {String} Returns the escaped character.
     */
    function escapeStringChar(match) {
      return '\\' + stringEscapes[match];
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {String} match The matched character to escape.
     * @returns {String} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {Mixed} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value) {
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * A no-operation function.
     *
     * @private
     */
    function noop() {
      // no operation performed
    }

    /**
     * A fallback implementation of `isPlainObject` which checks if a given `value`
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      // avoid non-objects and false positives for `arguments` objects
      var result = false;
      if (!(value && toString.call(value) == objectClass)) {
        return result;
      }
      // check that the constructor is `Object` (i.e. `Object instanceof Object`)
      var ctor = value.constructor;

      if (isFunction(ctor) ? ctor instanceof ctor : true) {
        // In most environments an object's own properties are iterated before
        // its inherited properties. If the last iterated property is an object's
        // own property then there are no inherited enumerable properties.
        forIn(value, function(value, key) {
          result = key;
        });
        return result === false || hasOwnProperty.call(value, result);
      }
      return result;
    }

    /**
     * Slices the `collection` from the `start` index up to, but not including,
     * the `end` index.
     *
     * Note: This function is used, instead of `Array#slice`, to support node lists
     * in IE < 9 and to ensure dense arrays are returned.
     *
     * @private
     * @param {Array|Object|String} collection The collection to slice.
     * @param {Number} start The start index.
     * @param {Number} end The end index.
     * @returns {Array} Returns the new array.
     */
    function slice(array, start, end) {
      start || (start = 0);
      if (typeof end == 'undefined') {
        end = array ? array.length : 0;
      }
      var index = -1,
          length = end - start || 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = array[start + index];
      }
      return result;
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {String} match The matched character to unescape.
     * @returns {String} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return toString.call(value) == argsClass;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray;

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns a new array of property names.
     */
    var shimKeys = function (object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;

        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {    
          result.push(index);    
          }
        }    
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns a new array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (order is not guaranteed)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a `callback` function is passed, it will be executed to produce
     * the assigned values. The `callback` is bound to `thisArg` and invoked with
     * two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {Object} [source1, source2, ...] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'moe' }, { 'age': 40 });
     * // => { 'name': 'moe', 'age': 40 }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var food = { 'name': 'apple' };
     * defaults(food, { 'name': 'banana', 'type': 'fruit' });
     * // => { 'name': 'apple', 'type': 'fruit' }
     */
    var assign = function (object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = lodash.createCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {;
      var length = iterable.length; index = -1;
      if (isArray(iterable)) {
        while (++index < length) {
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]
        }
      }
      else {    
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] ? keys(iterable) : [],
            length = ownProps.length;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]
        }    
      }
        }
      };
      return result
    };

    /**
     * Creates a clone of `value`. If `deep` is `true`, nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a `callback`
     * function is passed, it will be executed to produce the cloned values. If
     * `callback` returns `undefined`, cloning will be handled by the method instead.
     * The `callback` is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to clone.
     * @param {Boolean} [deep=false] A flag to indicate a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @param- {Array} [stackA=[]] Tracks traversed source objects.
     * @param- {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {Mixed} Returns the cloned `value`.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * var shallow = _.clone(stooges);
     * shallow[0] === stooges[0];
     * // => true
     *
     * var deep = _.clone(stooges, true);
     * deep[0] === stooges[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, deep, callback, thisArg, stackA, stackB) {
      var result = value;

      // allows working with "Collections" methods without using their `callback`
      // argument, `index|key`, for this method's `callback`
      if (typeof deep == 'function') {
        thisArg = callback;
        callback = deep;
        deep = false;
      }
      if (typeof callback == 'function') {
        callback = (typeof thisArg == 'undefined')
          ? callback
          : lodash.createCallback(callback, thisArg, 1);

        result = callback(result);
        if (typeof result != 'undefined') {
          return result;
        }
        result = value;
      }
      // inspect [[Class]]
      var isObj = isObject(result);
      if (isObj) {
        var className = toString.call(result);
        if (!cloneableClasses[className]) {
          return result;
        }
        var isArr = isArray(result);
      }
      // shallow clone
      if (!isObj || !deep) {
        return isObj
          ? (isArr ? slice(result) : assign({}, result))
          : result;
      }
      var ctor = ctorByClass[className];
      switch (className) {
        case boolClass:
        case dateClass:
          return new ctor(+result);

        case numberClass:
        case stringClass:
          return new ctor(result);

        case regexpClass:
          return ctor(result.source, reFlags.exec(result));
      }
      // check for circular references and return corresponding clone
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == value) {
          return stackB[length];
        }
      }
      // init cloned object
      result = isArr ? ctor(result.length) : {};

      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = clone(objValue, deep, callback, undefined, stackA, stackB);
      });

      return result;
    }

    /**
     * Creates a deep clone of `value`. If a `callback` function is passed,
     * it will be executed to produce the cloned values. If `callback` returns
     * `undefined`, cloning will be handled by the method instead. The `callback`
     * is bound to `thisArg` and invoked with one argument; (value).
     *
     * Note: This function is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the deep cloned `value`.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * var deep = _.cloneDeep(stooges);
     * deep[0] === stooges[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return clone(value, true, callback, thisArg);
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {Object} [source1, source2, ...] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  callback's `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var food = { 'name': 'apple' };
     * _.defaults(food, { 'name': 'banana', 'type': 'fruit' });
     * // => { 'name': 'apple', 'type': 'fruit' }
     */
    var defaults = function (object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {;
      var length = iterable.length; index = -1;
      if (isArray(iterable)) {
        while (++index < length) {
          if (typeof result[index] == 'undefined') result[index] = iterable[index]
        }
      }
      else {    
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] ? keys(iterable) : [],
            length = ownProps.length;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index]
        }    
      }
        }
      };
      return result
    };

    /**
     * This method is similar to `_.find`, except that it returns the key of the
     * element that passes the callback check, instead of the element itself.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the key of the found element, else `undefined`.
     * @example
     *
     * _.findKey({ 'a': 1, 'b': 2, 'c': 3, 'd': 4 }, function(num) {
     *   return num % 2 == 0;
     * });
     * // => 'b'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over `object`'s own and inherited enumerable properties, executing
     * the `callback` for each property. The `callback` is bound to `thisArg` and
     * invoked with three arguments; (value, key, object). Callbacks may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Dog(name) {
     *   this.name = name;
     * }
     *
     * Dog.prototype.bark = function() {
     *   alert('Woof, woof!');
     * };
     *
     * _.forIn(new Dog('Dagny'), function(value, key) {
     *   alert(key);
     * });
     * // => alerts 'name' and 'bark' (order is not guaranteed)
     */
    var forIn = function (collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg);

        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;    
        }    
      return result
    };

    /**
     * Iterates over an object's own enumerable properties, executing the `callback`
     * for each property. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by explicitly
     * returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   alert(key);
     * });
     * // => alerts '0', '1', and 'length' (order is not guaranteed)
     */
    var forOwn = function (collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg);

        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] ? keys(iterable) : [],
            length = ownProps.length;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result
        }    
      return result
    };

    /**
     * Creates a sorted array of all enumerable properties, own and inherited,
     * of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns a new array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified object `property` exists and is a direct property,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to check.
     * @param {String} property The property to check for.
     * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, property) {
      return object ? hasOwnProperty.call(object, property) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     *  _.invert({ 'first': 'moe', 'second': 'larry' });
     * // => { 'moe': 'first', 'larry': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || toString.call(value) == boolClass;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value ? (typeof value == 'object' && toString.call(value) == dateClass) : false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value ? value.nodeType === 1 : false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|String} value The value to inspect.
     * @returns {Boolean} Returns `true`, if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If `callback` is passed, it will be executed to
     * compare values. If `callback` returns `undefined`, comparisons will be handled
     * by the method instead. The `callback` is bound to `thisArg` and invoked with
     * two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} a The value to compare.
     * @param {Mixed} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @param- {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param- {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {Boolean} Returns `true`, if the values are equivalent, else `false`.
     * @example
     *
     * var moe = { 'name': 'moe', 'age': 40 };
     * var copy = { 'name': 'moe', 'age': 40 };
     *
     * moe == copy;
     * // => false
     *
     * _.isEqual(moe, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      var whereIndicator = callback === indicatorObject;
      if (typeof callback == 'function' && !whereIndicator) {
        callback = lodash.createCallback(callback, thisArg, 2);
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          (!a || (type != 'function' && type != 'object')) &&
          (!b || (otherType != 'function' && otherType != 'object'))) {
        return false;
      }
      // exit early for `null` and `undefined`, avoiding ES3's Function#call behavior
      // http://es5.github.com/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0`, treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.com/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        if (hasOwnProperty.call(a, '__wrapped__ ') || hasOwnProperty.call(b, '__wrapped__')) {
          return isEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, thisArg, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB && !(
              isFunction(ctorA) && ctorA instanceof ctorA &&
              isFunction(ctorB) && ctorB instanceof ctorB
            )) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.com/#x15.12.3)
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        length = a.length;
        size = b.length;

        // compare lengths to determine if a deep comparison is necessary
        result = size == a.length;
        if (!result && !whereIndicator) {
          return result;
        }
        // deep compare the contents, ignoring non-numeric properties
        while (size--) {
          var index = length,
              value = b[size];

          if (whereIndicator) {
            while (index--) {
              if ((result = isEqual(a[index], value, callback, thisArg, stackA, stackB))) {
                break;
              }
            }
          } else if (!(result = isEqual(a[size], value, callback, thisArg, stackA, stackB))) {
            break;
          }
        }
        return result;
      }
      // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
      // which, in this case, is more costly
      forIn(b, function(value, key, b) {
        if (hasOwnProperty.call(b, key)) {
          // count the number of properties.
          size++;
          // deep compare each property value.
          return (result = hasOwnProperty.call(a, key) && isEqual(a[key], value, callback, thisArg, stackA, stackB));
        }
      });

      if (result && !whereIndicator) {
        // ensure both objects have the same number of properties
        forIn(a, function(value, key, a) {
          if (hasOwnProperty.call(a, key)) {
            // `size` will be `-1` if `a` has more properties than `b`
            return (result = --size > -1);
          }
        });
      }
      return result;
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite`, which will return true for
     * booleans and empty strings. See http://es5.github.com/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.com/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return value ? objectTypes[typeof value] : false;
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN`, which will return `true` for
     * `undefined` and other values. See http://es5.github.com/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' || toString.call(value) == numberClass;
    }

    /**
     * Checks if a given `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if `value` is a plain object, else `false`.
     * @example
     *
     * function Stooge(name, age) {
     *   this.name = name;
     *   this.age = age;
     * }
     *
     * _.isPlainObject(new Stooge('moe', 40));
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'name': 'moe', 'age': 40 });
     * // => true
     */
    var isPlainObject = function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = typeof valueOf == 'function' && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/moe/);
     * // => true
     */
    function isRegExp(value) {
      return value ? (typeof value == 'object' && toString.call(value) == regexpClass) : false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('moe');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' || toString.call(value) == stringClass;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true`, if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined`, into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a `callback` function
     * is passed, it will be executed to produce the merged values of the destination
     * and source properties. If `callback` returns `undefined`, merging will be
     * handled by the method instead. The `callback` is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {Object} [source1, source2, ...] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @param- {Object} [deepIndicator] Indicates that `stackA` and `stackB` are
     *  arrays of traversed objects, instead of source objects.
     * @param- {Array} [stackA=[]] Tracks traversed source objects.
     * @param- {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'stooges': [
     *     { 'name': 'moe' },
     *     { 'name': 'larry' }
     *   ]
     * };
     *
     * var ages = {
     *   'stooges': [
     *     { 'age': 40 },
     *     { 'age': 50 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'stooges': [{ 'name': 'moe', 'age': 40 }, { 'name': 'larry', 'age': 50 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object, source, deepIndicator) {
      var args = arguments,
          index = 0,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      if (deepIndicator === indicatorObject) {
        var callback = args[3],
            stackA = args[4],
            stackB = args[5];
      } else {
        stackA = [];
        stackB = [];

        // allows working with `_.reduce` and `_.reduceRight` without
        // using their `callback` arguments, `index|key` and `collection`
        if (typeof deepIndicator != 'number') {
          length = args.length;
        }
        if (length > 3 && typeof args[length - 2] == 'function') {
          callback = lodash.createCallback(args[--length - 1], args[length--], 2);
        } else if (length > 2 && typeof args[length - 1] == 'function') {
          callback = args[--length];
        }
      }
      while (++index < length) {
        (isArray(args[index]) ? forEach : forOwn)(args[index], function(source, key) {
          var found,
              isArr,
              result = source,
              value = object[key];

          if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
            // avoid merging previously merged cyclic sources
            var stackLength = stackA.length;
            while (stackLength--) {
              if ((found = stackA[stackLength] == source)) {
                value = stackB[stackLength];
                break;
              }
            }
            if (!found) {
              var isShallow;
              if (callback) {
                result = callback(value, source);
                if ((isShallow = typeof result != 'undefined')) {
                  value = result;
                }
              }
              if (!isShallow) {
                value = isArr
                  ? (isArray(value) ? value : [])
                  : (isPlainObject(value) ? value : {});
              }
              // add `source` and associated `value` to the stack of traversed objects
              stackA.push(source);
              stackB.push(value);

              // recursively merge objects and arrays (susceptible to call stack limits)
              if (!isShallow) {
                value = merge(value, source, indicatorObject, callback, stackA, stackB);
              }
            }
          }
          else {
            if (callback) {
              result = callback(value, source);
              if (typeof result == 'undefined') {
                result = source;
              }
            }
            if (typeof result != 'undefined') {
              value = result;
            }
          }
          object[key] = value;
        });
      }
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a `callback` function is passed, it will be executed
     * for each property in the `object`, omitting the properties `callback`
     * returns truthy for. The `callback` is bound to `thisArg` and invoked
     * with three arguments; (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|String} callback|[prop1, prop2, ...] The properties to omit
     *  or the function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'moe', 'age': 40 }, 'age');
     * // => { 'name': 'moe' }
     *
     * _.omit({ 'name': 'moe', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'moe' }
     */
    function omit(object, callback, thisArg) {
      var isFunc = typeof callback == 'function',
          result = {};

      if (isFunc) {
        callback = lodash.createCallback(callback, thisArg);
      } else {
        var props = concat.apply(arrayRef, nativeSlice.call(arguments, 1));
      }
      forIn(object, function(value, key, object) {
        if (isFunc
              ? !callback(value, key, object)
              : indexOf(props, key) < 0
            ) {
          result[key] = value;
        }
      });
      return result;
    }

    /**
     * Creates a two dimensional array of the given object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'moe': 30, 'larry': 40 });
     * // => [['moe', 30], ['larry', 40]] (order is not guaranteed)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of property
     * names. If `callback` is passed, it will be executed for each property in the
     * `object`, picking the properties `callback` returns truthy for. The `callback`
     * is bound to `thisArg` and invoked with three arguments; (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Array|Function|String} callback|[prop1, prop2, ...] The function called
     *  per iteration or properties to pick, either as individual arguments or arrays.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'moe', '_userid': 'moe1' }, 'name');
     * // => { 'name': 'moe' }
     *
     * _.pick({ 'name': 'moe', '_userid': 'moe1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'moe' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = concat.apply(arrayRef, nativeSlice.call(arguments, 1)),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (order is not guaranteed)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Array|Number|String} [index1, index2, ...] The indexes of
     *  `collection` to retrieve, either as individual arguments or arrays.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['moe', 'larry', 'curly'], 0, 2);
     * // => ['moe', 'curly']
     */
    function at(collection) {
      var index = -1,
          props = concat.apply(arrayRef, nativeSlice.call(arguments, 1)),
          length = props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given `target` element is present in a `collection` using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Mixed} target The value to check for.
     * @param {Number} [fromIndex=0] The index to search from.
     * @returns {Boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'moe', 'age': 40 }, 'moe');
     * // => true
     *
     * _.contains('curly', 'ur');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (typeof length == 'number') {
        result = (isString(collection)
          ? collection.indexOf(target, fromIndex)
          : indexOf(collection, target, fromIndex)
        ) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys returned from running each element of the
     * `collection` through the given `callback`. The corresponding value of each key
     * is the number of times the key was returned by the `callback`. The `callback`
     * is bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    function countBy(collection, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg);

      forEach(collection, function(value, key, collection) {
        key = String(callback(value, key, collection));
        (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
      });
      return result;
    }

    /**
     * Checks if the `callback` returns a truthy value for **all** elements of a
     * `collection`. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Boolean} Returns `true` if all elements pass the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(stooges, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(stooges, { 'age': 50 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Examines each element in a `collection`, returning an array of all elements
     * the `callback` returns truthy for. The `callback` is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(food, 'organic');
     * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
     *
     * // using "_.where" callback shorthand
     * _.filter(food, { 'type': 'fruit' });
     * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Examines each element in a `collection`, returning the first that the `callback`
     * returns truthy for. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the found element, else `undefined`.
     * @example
     *
     * _.find([1, 2, 3, 4], function(num) {
     *   return num % 2 == 0;
     * });
     * // => 2
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'banana', 'organic': true,  'type': 'fruit' },
     *   { 'name': 'beet',   'organic': false, 'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.find(food, { 'type': 'vegetable' });
     * // => { 'name': 'beet', 'organic': false, 'type': 'vegetable' }
     *
     * // using "_.pluck" callback shorthand
     * _.find(food, 'organic');
     * // => { 'name': 'banana', 'organic': true, 'type': 'fruit' }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * Iterates over a `collection`, executing the `callback` for each element in
     * the `collection`. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection). Callbacks may exit iteration early
     * by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|String} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(alert).join(',');
     * // => alerts each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, alert);
     * // => alerts each number value (order is not guaranteed)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * Creates an object composed of keys returned from running each element of the
     * `collection` through the `callback`. The corresponding value of each key is
     * an array of elements passed to `callback` that returned the key. The `callback`
     * is bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    function groupBy(collection, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg);

      forEach(collection, function(value, key, collection) {
        key = String(callback(value, key, collection));
        (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
      });
      return result;
    }

    /**
     * Invokes the method named by `methodName` on each element in the `collection`,
     * returning an array of the results of each invoked method. Additional arguments
     * will be passed to each invoked method. If `methodName` is a function, it will
     * be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|String} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = nativeSlice.call(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the `collection`
     * through the `callback`. The `callback` is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (order is not guaranteed)
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(stooges, 'name');
     * // => ['moe', 'larry']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of an `array`. If `callback` is passed,
     * it will be executed for each value in the `array` to generate the
     * criterion by which the value is ranked. The `callback` is bound to
     * `thisArg` and invoked with three arguments; (value, index, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.max(stooges, function(stooge) { return stooge.age; });
     * // => { 'name': 'larry', 'age': 50 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(stooges, 'age');
     * // => { 'name': 'larry', 'age': 50 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      if (!callback && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (!callback && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of an `array`. If `callback` is passed,
     * it will be executed for each value in the `array` to generate the
     * criterion by which the value is ranked. The `callback` is bound to `thisArg`
     * and invoked with three arguments; (value, index, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.min(stooges, function(stooge) { return stooge.age; });
     * // => { 'name': 'moe', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(stooges, 'age');
     * // => { 'name': 'moe', 'age': 40 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      if (!callback && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (!callback && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the `collection`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {String} property The property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.pluck(stooges, 'name');
     * // => ['moe', 'larry']
     */
    function pluck(collection, property) {
      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = collection[index][property];
        }
      }
      return result || map(collection, property);
    }

    /**
     * Reduces a `collection` to a value which is the accumulated result of running
     * each element in the `collection` through the `callback`, where each successive
     * `callback` execution consumes the return value of the previous execution.
     * If `accumulator` is not passed, the first element of the `collection` will be
     * used as the initial `accumulator` value. The `callback` is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {Mixed} [accumulator] Initial value of the accumulator.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is similar to `_.reduce`, except that it iterates over a
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {Mixed} [accumulator] Initial value of the accumulator.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var iterable = collection,
          length = collection ? collection.length : 0,
          noaccum = arguments.length < 3;

      if (typeof length != 'number') {
        var props = keys(collection);
        length = props.length;
      }
      callback = lodash.createCallback(callback, thisArg, 4);
      forEach(collection, function(value, index, collection) {
        index = props ? props[--length] : --length;
        accumulator = noaccum
          ? (noaccum = false, iterable[index])
          : callback(accumulator, iterable[index], index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter`, this method returns the elements of a
     * `collection` that `callback` does **not** return truthy for.
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that did **not** pass the
     *  callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(food, 'organic');
     * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
     *
     * // using "_.where" callback shorthand
     * _.reject(food, { 'type': 'fruit' });
     * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Creates an array of shuffled `array` values, using a version of the
     * Fisher-Yates shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = floor(nativeRandom() * (++index + 1));
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to inspect.
     * @returns {Number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('curly');
     * // => 5
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the `callback` returns a truthy value for **any** element of a
     * `collection`. The function returns as soon as it finds passing value, and
     * does not iterate over the entire `collection`. The `callback` is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Boolean} Returns `true` if any element passes the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(food, 'organic');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(food, { 'type': 'meat' });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in the `collection` through the `callback`. This method
     * performs a stable sort, that is, it will preserve the original sort order of
     * equal elements. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * // using "_.pluck" callback shorthand
     * _.sortBy(['banana', 'strawberry', 'apple'], 'length');
     * // => ['apple', 'banana', 'strawberry']
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      callback = lodash.createCallback(callback, thisArg);
      forEach(collection, function(value, key, collection) {
        result[++index] = {
          'criteria': callback(value, key, collection),
          'index': index,
          'value': value
        };
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        result[length] = result[length].value;
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|String} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Examines each element in a `collection`, returning an array of all elements
     * that have the given `properties`. When checking `properties`, this method
     * performs a deep comparison between values to determine if they are equivalent
     * to each other.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|String} collection The collection to iterate over.
     * @param {Object} properties The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given `properties`.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.where(stooges, { 'age': 40 });
     * // => [{ 'name': 'moe', 'age': 40 }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values of `array` removed. The values
     * `false`, `null`, `0`, `""`, `undefined` and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new filtered array.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array of `array` elements not present in the other arrays
     * using strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {Array} [array1, array2, ...] Arrays to check.
     * @returns {Array} Returns a new array of `array` elements not present in the
     *  other arrays.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      var index = -1,
          length = array ? array.length : 0,
          flattened = concat.apply(arrayRef, nativeSlice.call(arguments, 1)),
          contains = cachedContains(flattened),
          result = [];

      while (++index < length) {
        var value = array[index];
        if (!contains(value)) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * This method is similar to `_.find`, except that it returns the index of
     * the element that passes the callback check, instead of the element itself.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the index of the found element, else `-1`.
     * @example
     *
     * _.findIndex(['apple', 'banana', 'beet'], function(food) {
     *   return /^b/.test(food);
     * });
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Gets the first element of the `array`. If a number `n` is passed, the first
     * `n` elements of the `array` are returned. If a `callback` function is passed,
     * elements at the beginning of the array are returned as long as the `callback`
     * returns truthy. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|Number|String} [callback|n] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is passed, it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var food = [
     *   { 'name': 'banana', 'organic': true },
     *   { 'name': 'beet',   'organic': false },
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(food, 'organic');
     * // => [{ 'name': 'banana', 'organic': true }]
     *
     * var food = [
     *   { 'name': 'apple',  'type': 'fruit' },
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.first(food, { 'type': 'fruit' });
     * // => [{ 'name': 'apple', 'type': 'fruit' }, { 'name': 'banana', 'type': 'fruit' }]
     */
    function first(array, callback, thisArg) {
      if (array) {
        var n = 0,
            length = array.length;

        if (typeof callback != 'number' && callback != null) {
          var index = -1;
          callback = lodash.createCallback(callback, thisArg);
          while (++index < length && callback(array[index], index, array)) {
            n++;
          }
        } else {
          n = callback;
          if (n == null || thisArg) {
            return array[0];
          }
        }
        return slice(array, 0, nativeMin(nativeMax(0, n), length));
      }
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truthy, `array` will only be flattened a single level. If `callback`
     * is passed, each element of `array` is passed through a `callback` before
     * flattening. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {Boolean} [isShallow=false] A flag to indicate only flattening a single level.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var stooges = [
     *   { 'name': 'curly', 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] },
     *   { 'name': 'moe', 'quotes': ['Spread out!', 'You knucklehead!'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(stooges, 'quotes');
     * // => ['Oh, a wise guy, eh?', 'Poifect!', 'Spread out!', 'You knucklehead!']
     */
    function flatten(array, isShallow, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = isShallow;
        isShallow = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg);
      }
      while (++index < length) {
        var value = array[index];
        if (callback) {
          value = callback(value, index, array);
        }
        // recursively flatten arrays (susceptible to call stack limits)
        if (isArray(value)) {
          push.apply(result, isShallow ? value : flatten(value));
        } else {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the `array` is already
     * sorted, passing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Mixed} value The value to search for.
     * @param {Boolean|Number} [fromIndex=0] The index to search from or `true` to
     *  perform a binary search on a sorted `array`.
     * @returns {Number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      var index = -1,
          length = array ? array.length : 0;

      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0) - 1;
      } else if (fromIndex) {
        index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Gets all but the last element of `array`. If a number `n` is passed, the
     * last `n` elements are excluded from the result. If a `callback` function
     * is passed, elements at the end of the array are excluded from the result
     * as long as the `callback` returns truthy. The `callback` is bound to
     * `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|Number|String} [callback|n=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is passed, it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var food = [
     *   { 'name': 'beet',   'organic': false },
     *   { 'name': 'carrot', 'organic': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(food, 'organic');
     * // => [{ 'name': 'beet',   'organic': false }]
     *
     * var food = [
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' },
     *   { 'name': 'carrot', 'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.initial(food, { 'type': 'vegetable' });
     * // => [{ 'name': 'banana', 'type': 'fruit' }]
     */
    function initial(array, callback, thisArg) {
      if (!array) {
        return [];
      }
      var n = 0,
          length = array.length;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Computes the intersection of all the passed-in arrays using strict equality
     * for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} [array1, array2, ...] Arrays to process.
     * @returns {Array} Returns a new array of unique elements that are present
     *  in **all** of the arrays.
     * @example
     *
     * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
     * // => [1, 2]
     */
    function intersection(array) {
      var args = arguments,
          argsLength = args.length,
          cache = { '0': {} },
          index = -1,
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize,
          result = [],
          seen = result;

      outer:
      while (++index < length) {
        var value = array[index];
        if (isLarge) {
          var key = keyPrefix + value;
          var inited = cache[0][key]
            ? !(seen = cache[0][key])
            : (seen = cache[0][key] = []);
        }
        if (inited || indexOf(seen, value) < 0) {
          if (isLarge) {
            seen.push(value);
          }
          var argsIndex = argsLength;
          while (--argsIndex) {
            if (!(cache[argsIndex] || (cache[argsIndex] = cachedContains(args[argsIndex])))(value)) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Gets the last element of the `array`. If a number `n` is passed, the
     * last `n` elements of the `array` are returned. If a `callback` function
     * is passed, elements at the end of the array are returned as long as the
     * `callback` returns truthy. The `callback` is bound to `thisArg` and
     * invoked with three arguments;(value, index, array).
     *
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|Number|String} [callback|n] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is passed, it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Mixed} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var food = [
     *   { 'name': 'beet',   'organic': false },
     *   { 'name': 'carrot', 'organic': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.last(food, 'organic');
     * // => [{ 'name': 'carrot', 'organic': true }]
     *
     * var food = [
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' },
     *   { 'name': 'carrot', 'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.last(food, { 'type': 'vegetable' });
     * // => [{ 'name': 'beet', 'type': 'vegetable' }, { 'name': 'carrot', 'type': 'vegetable' }]
     */
    function last(array, callback, thisArg) {
      if (array) {
        var n = 0,
            length = array.length;

        if (typeof callback != 'number' && callback != null) {
          var index = length;
          callback = lodash.createCallback(callback, thisArg);
          while (index-- && callback(array[index], index, array)) {
            n++;
          }
        } else {
          n = callback;
          if (n == null || thisArg) {
            return array[length - 1];
          }
        }
        return slice(array, nativeMax(0, length - n));
      }
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Mixed} value The value to search for.
     * @param {Number} [fromIndex=array.length-1] The index to search from.
     * @returns {Number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Number} [start=0] The start of the range.
     * @param {Number} end The end of the range.
     * @param {Number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(10);
     * // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     *
     * _.range(1, 11);
     * // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     *
     * _.range(0, 30, 5);
     * // => [0, 5, 10, 15, 20, 25]
     *
     * _.range(0, -10, -1);
     * // => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = +step || 1;

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so V8 will avoid the slower "dictionary" mode
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / step)),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * The opposite of `_.initial`, this method gets all but the first value of
     * `array`. If a number `n` is passed, the first `n` values are excluded from
     * the result. If a `callback` function is passed, elements at the beginning
     * of the array are excluded from the result as long as the `callback` returns
     * truthy. The `callback` is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|Number|String} [callback|n=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is passed, it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var food = [
     *   { 'name': 'banana', 'organic': true },
     *   { 'name': 'beet',   'organic': false },
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.rest(food, 'organic');
     * // => [{ 'name': 'beet', 'organic': false }]
     *
     * var food = [
     *   { 'name': 'apple',  'type': 'fruit' },
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.rest(food, { 'type': 'fruit' });
     * // => [{ 'name': 'beet', 'type': 'vegetable' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which the `value`
     * should be inserted into `array` in order to maintain the sort order of the
     * sorted `array`. If `callback` is passed, it will be executed for `value` and
     * each element in `array` to compute their sort ranking. The `callback` is
     * bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {Mixed} value The value to evaluate.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Number} Returns the index at which the value should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Computes the union of the passed-in arrays using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} [array1, array2, ...] Arrays to process.
     * @returns {Array} Returns a new array of unique values, in order, that are
     *  present in one or more of the arrays.
     * @example
     *
     * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
     * // => [1, 2, 3, 101, 10]
     */
    function union(array) {
      if (!isArray(array)) {
        arguments[0] = array ? nativeSlice.call(array) : arrayRef;
      }
      return uniq(concat.apply(arrayRef, arguments));
    }

    /**
     * Creates a duplicate-value-free version of the `array` using strict equality
     * for comparisons, i.e. `===`. If the `array` is already sorted, passing `true`
     * for `isSorted` will run a faster algorithm. If `callback` is passed, each
     * element of `array` is passed through a `callback` before uniqueness is computed.
     * The `callback` is bound to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is passed for `callback`, the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is passed for `callback`, the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {Boolean} [isSorted=false] A flag to indicate that the `array` is already sorted.
     * @param {Function|Object|String} [callback=identity] The function called per
     *  iteration. If a property name or object is passed, it will be used to create
     *  a "_.pluck" or "_.where" style callback, respectively.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 2, 1.5, 3, 2.5], function(num) { return Math.floor(num); });
     * // => [1, 2, 3]
     *
     * _.uniq([1, 2, 1.5, 3, 2.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [],
          seen = result;

      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = isSorted;
        isSorted = false;
      }
      // init value cache for large arrays
      var isLarge = !isSorted && length >= largeArraySize;
      if (isLarge) {
        var cache = {};
      }
      if (callback != null) {
        seen = [];
        callback = lodash.createCallback(callback, thisArg);
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isLarge) {
          var key = keyPrefix + computed;
          var inited = cache[key]
            ? !(seen = cache[key])
            : (seen = cache[key] = []);
        }
        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : inited || indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The inverse of `_.zip`, this method splits groups of elements into arrays
     * composed of elements from each group at their corresponding indexes.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @returns {Array} Returns a new array of the composed arrays.
     * @example
     *
     * _.unzip([['moe', 30, true], ['larry', 40, false]]);
     * // => [['moe', 'larry'], [30, 40], [true, false]];
     */
    function unzip(array) {
      var index = -1,
          length = array ? array.length : 0,
          tupleLength = length ? max(pluck(array, 'length')) : 0,
          result = Array(tupleLength);

      while (++index < length) {
        var tupleIndex = -1,
            tuple = array[index];

        while (++tupleIndex < tupleLength) {
          (result[tupleIndex] || (result[tupleIndex] = Array(length)))[index] = tuple[tupleIndex];
        }
      }
      return result;
    }

    /**
     * Creates an array with all occurrences of the passed values removed using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {Mixed} [value1, value2, ...] Values to remove.
     * @returns {Array} Returns a new filtered array.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return difference(array, nativeSlice.call(arguments, 1));
    }

    /**
     * Groups the elements of each array at their corresponding indexes. Useful for
     * separate data sources that are coordinated through matching array indexes.
     * For a matrix of nested arrays, `_.zip.apply(...)` can transpose the matrix
     * in a similar fashion.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} [array1, array2, ...] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['moe', 'larry'], [30, 40], [true, false]);
     * // => [['moe', 30, true], ['larry', 40, false]]
     */
    function zip(array) {
      var index = -1,
          length = array ? max(pluck(arguments, 'length')) : 0,
          result = Array(length);

      while (++index < length) {
        result[index] = pluck(arguments, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Pass either
     * a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`, or
     * two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['moe', 'larry'], [30, 40]);
     * // => { 'moe': 30, 'larry': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * If `n` is greater than `0`, a function is created that is restricted to
     * executing `func`, with the `this` binding and arguments of the created
     * function, only after it is called `n` times. If `n` is less than `1`,
     * `func` is executed immediately, without a `this` binding or additional
     * arguments, and its result is returned.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Number} n The number of times the function must be called before
     * it is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var renderNotes = _.after(notes.length, render);
     * _.forEach(notes, function(note) {
     *   note.asyncSave({ 'success': renderNotes });
     * });
     * // `renderNotes` is run once, after all notes have saved
     */
    function after(n, func) {
      if (n < 1) {
        return func();
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * passed to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {Mixed} [thisArg] The `this` binding of `func`.
     * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'moe' }, 'hi');
     * func();
     * // => 'hi moe'
     */
    function bind(func, thisArg) {
      // use `Function#bind` if it exists and is fast
      // (in V8 `Function#bind` is slower except when partially applied)
      return support.fastBind || (nativeBind && arguments.length > 2)
        ? nativeBind.call.apply(nativeBind, arguments)
        : createBound(func, thisArg, nativeSlice.call(arguments, 2));
    }

    /**
     * Binds methods on `object` to `object`, overwriting the existing method.
     * Method names may be specified as individual arguments or as arrays of method
     * names. If no method names are provided, all the function properties of `object`
     * will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {String} [methodName1, methodName2, ...] Method names on the object to bind.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *  'label': 'docs',
     *  'onClick': function() { alert('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => alerts 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? concat.apply(arrayRef, nativeSlice.call(arguments, 1)) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = bind(object[key], object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those passed to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {String} key The key of the method.
     * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'moe',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi moe'
     *
     * object.greet = function(greeting) {
     *   return greeting + ', ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hi, moe!'
     */
    function bindKey(object, key) {
      return createBound(object, key, nativeSlice.call(arguments, 2), indicatorObject);
    }

    /**
     * Creates a function that is the composition of the passed functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} [func1, func2, ...] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var greet = function(name) { return 'hi ' + name; };
     * var exclaim = function(statement) { return statement + '!'; };
     * var welcome = _.compose(exclaim, greet);
     * welcome('moe');
     * // => 'hi moe!'
     */
    function compose() {
      var funcs = arguments;
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name, the created callback will return the property value for a given element.
     * If `func` is an object, the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * Note: All Lo-Dash methods, that accept a `callback` argument, use `_.createCallback`.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Mixed} [func=identity] The value to convert to a callback.
     * @param {Mixed} [thisArg] The `this` binding of the created callback.
     * @param {Number} [argCount=3] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(stooges, 'age__gt45');
     * // => [{ 'name': 'larry', 'age': 50 }]
     *
     * // create mixins with support for "_.pluck" and "_.where" callback shorthands
     * _.mixin({
     *   'toLookup': function(collection, callback, thisArg) {
     *     callback = _.createCallback(callback, thisArg);
     *     return _.reduce(collection, function(result, value, index, collection) {
     *       return (result[callback(value, index, collection)] = value, result);
     *     }, {});
     *   }
     * });
     *
     * _.toLookup(stooges, 'name');
     * // => { 'moe': { 'name': 'moe', 'age': 40 }, 'larry': { 'name': 'larry', 'age': 50 } }
     */
    function createCallback(func, thisArg, argCount) {
      if (func == null) {
        return identity;
      }
      var type = typeof func;
      if (type != 'function') {
        if (type != 'object') {
          return function(object) {
            return object[func];
          };
        }
        var props = keys(func);
        return function(object) {
          var length = props.length,
              result = false;
          while (length--) {
            if (!(result = isEqual(object[props[length]], func[props[length]], indicatorObject))) {
              break;
            }
          }
          return result;
        };
      }
      if (typeof thisArg != 'undefined') {
        if (argCount === 1) {
          return function(value) {
            return func.call(thisArg, value);
          };
        }
        if (argCount === 2) {
          return function(a, b) {
            return func.call(thisArg, a, b);
          };
        }
        if (argCount === 4) {
          return function(accumulator, value, index, collection) {
            return func.call(thisArg, accumulator, value, index, collection);
          };
        }
        return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
      }
      return func;
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked. Pass
     * an `options` object to indicate that `func` should be invoked on the leading
     * and/or trailing edge of the `wait` timeout. Subsequent calls to the debounced
     * function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true`, `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {Number} wait The number of milliseconds to delay.
     * @param {Object} options The options object.
     *  [leading=false] A boolean to specify execution on the leading edge of the timeout.
     *  [trailing=true] A boolean to specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * var lazyLayout = _.debounce(calculateLayout, 300);
     * jQuery(window).on('resize', lazyLayout);
     *
     * jQuery('#postbox').on('click', _.debounce(sendMail, 200, {
     *   'leading': true,
     *   'trailing': false
     * });
     */
    function debounce(func, wait, options) {
      var args,
          inited,
          result,
          thisArg,
          timeoutId,
          trailing = true;

      function delayed() {
        inited = timeoutId = null;
        if (trailing) {
          result = func.apply(thisArg, args);
        }
      }
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (options && objectTypes[typeof options]) {
        leading = options.leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      return function() {
        args = arguments;
        thisArg = this;
        clearTimeout(timeoutId);

        if (!inited && leading) {
          inited = true;
          result = func.apply(thisArg, args);
        } else {
          timeoutId = setTimeout(delayed, wait);
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be passed to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
     * @returns {Number} Returns the timer id.
     * @example
     *
     * _.defer(function() { alert('deferred'); });
     * // returns from the function before `alert` is called
     */
    function defer(func) {
      var args = nativeSlice.call(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }
    // use `setImmediate` if it's available in Node.js
    if (isV8 && freeModule && typeof setImmediate == 'function') {
      defer = bind(setImmediate, context);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be passed to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {Number} wait The number of milliseconds to delay execution.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
     * @returns {Number} Returns the timer id.
     * @example
     *
     * var log = _.bind(console.log, console);
     * _.delay(log, 1000, 'logged later');
     * // => 'logged later' (Appears after one second.)
     */
    function delay(func, wait) {
      var args = nativeSlice.call(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * passed, it will be used to determine the cache key for storing the result
     * based on the arguments passed to the memoized function. By default, the first
     * argument passed to the memoized function is used as the cache key. The `func`
     * is executed with the `this` binding of the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     */
    function memoize(func, resolver) {
      var cache = {};
      return function() {
        var key = keyPrefix + (resolver ? resolver.apply(this, arguments) : arguments[0]);
        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      };
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those passed to the new function. This
     * method is similar to `_.bind`, except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('moe');
     * // => 'hi moe'
     */
    function partial(func) {
      return createBound(func, nativeSlice.call(arguments, 1));
    }

    /**
     * This method is similar to `_.partial`, except that `partial` arguments are
     * appended to those passed to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createBound(func, nativeSlice.call(arguments, 1), null, indicatorObject);
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Pass an `options` object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true`, `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {Number} wait The number of milliseconds to throttle executions to.
     * @param {Object} options The options object.
     *  [leading=true] A boolean to specify execution on the leading edge of the timeout.
     *  [trailing=true] A boolean to specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var args,
          result,
          thisArg,
          timeoutId,
          lastCalled = 0,
          leading = true,
          trailing = true;

      function trailingCall() {
        timeoutId = null;
        if (trailing) {
          lastCalled = new Date;
          result = func.apply(thisArg, args);
        }
      }
      if (options === false) {
        leading = false;
      } else if (options && objectTypes[typeof options]) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      return function() {
        var now = new Date;
        if (!timeoutId && !leading) {
          lastCalled = now;
        }
        var remaining = wait - (now - lastCalled);
        args = arguments;
        thisArg = this;

        if (remaining <= 0) {
          clearTimeout(timeoutId);
          timeoutId = null;
          lastCalled = now;
          result = func.apply(thisArg, args);
        }
        else if (!timeoutId) {
          timeoutId = setTimeout(trailingCall, remaining);
        }
        return result;
      };
    }

    /**
     * Creates a function that passes `value` to the `wrapper` function as its
     * first argument. Additional arguments passed to the function are appended
     * to those passed to the `wrapper` function. The `wrapper` is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Mixed} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var hello = function(name) { return 'hello ' + name; };
     * hello = _.wrap(hello, function(func) {
     *   return 'before, ' + func('moe') + ', after';
     * });
     * hello();
     * // => 'before, hello moe, after'
     */
    function wrap(value, wrapper) {
      return function() {
        var args = [value];
        push.apply(args, arguments);
        return wrapper.apply(this, args);
      };
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} string The string to escape.
     * @returns {String} Returns the escaped string.
     * @example
     *
     * _.escape('Moe, Larry & Curly');
     * // => 'Moe, Larry &amp; Curly'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This function returns the first argument passed to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Mixed} value Any value.
     * @returns {Mixed} Returns `value`.
     * @example
     *
     * var moe = { 'name': 'moe' };
     * moe === _.identity(moe);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds functions properties of `object` to the `lodash` function and chainable
     * wrapper.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object of function properties to add to `lodash`.
     * @example
     *
     * _.mixin({
     *   'capitalize': function(string) {
     *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     *   }
     * });
     *
     * _.capitalize('moe');
     * // => 'Moe'
     *
     * _('moe').capitalize();
     * // => 'Moe'
     */
    function mixin(object) {
      forEach(functions(object), function(methodName) {
        var func = lodash[methodName] = object[methodName];

        lodash.prototype[methodName] = function() {
          var value = this.__wrapped__,
              args = [value];

          push.apply(args, arguments);
          var result = func.apply(lodash, args);
          return (value && typeof value == 'object' && value == result)
            ? this
            : new lodashWrapper(result);
        };
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * Converts the given `value` into an integer of the specified `radix`.
     * If `radix` is `undefined` or `0`, a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.com/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} value The value to parse.
     * @param {Number} [radix] The radix used to interpret the value to parse.
     * @returns {Number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox and Opera still follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is passed, a number between `0` and the given number will be returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Number} [min=0] The minimum possible value.
     * @param {Number} [max=1] The maximum possible value.
     * @returns {Number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => a number between 0 and 5
     *
     * _.random(5);
     * // => also a number between 0 and 5
     */
    function random(min, max) {
      if (min == null && max == null) {
        max = 1;
      }
      min = +min || 0;
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + floor(nativeRandom() * ((+max || 0) - min + 1));
    }

    /**
     * Resolves the value of `property` on `object`. If `property` is a function,
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey, then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {String} property The property to get the value of.
     * @returns {Mixed} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, property) {
      var value = object ? object[property] : undefined;
      return isFunction(value) ? object[property]() : value;
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/#custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} options The options object.
     *  escape - The "escape" delimiter regexp.
     *  evaluate - The "evaluate" delimiter regexp.
     *  interpolate - The "interpolate" delimiter regexp.
     *  sourceURL - The sourceURL of the template's compiled source.
     *  variable - The data object variable name.
     * @returns {Function|String} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'moe' });
     * // => 'hello moe'
     *
     * var list = '<% _.forEach(people, function(name) { %><li><%= name %></li><% }); %>';
     * _.template(list, { 'people': ['moe', 'larry'] });
     * // => '<li>moe</li><li>larry</li>'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'curly' });
     * // => 'hello curly'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + epithet); %>!', { 'epithet': 'stooge' });
     * // => 'hello stooge!'
     *
     * // using custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text || (text = '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging and wrap in a multi-line comment to
      // avoid issues with Narwhal, IE conditional compilation, and the JS engine
      // embedded in Adobe products.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//@ sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source via its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the `callback` function `n` times, returning an array of the results
     * of each `callback` execution. The `callback` is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = lodash.createCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape`, this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} string The string to unescape.
     * @returns {String} Returns the unescaped string.
     * @example
     *
     * _.unescape('Moe, Larry &amp; Curly');
     * // => 'Moe, Larry & Curly'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is passed, the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {String} [prefix] The value to prefix the ID with.
     * @returns {String} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Invokes `interceptor` with the `value` as the first argument, and then
     * returns `value`. The purpose of this method is to "tap into" a method chain,
     * in order to perform operations on intermediate results within the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {Mixed} value The value to pass to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {Mixed} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .filter(function(num) { return num % 2 == 0; })
     *  .tap(alert)
     *  .map(function(num) { return num * num; })
     *  .value();
     * // => // [2, 4] (alerted)
     * // => [4, 16]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {String} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {Mixed} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.countBy = countBy;
    lodash.createCallback = createCallback;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forIn = forIn;
    lodash.forOwn = forOwn;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.range = range;
    lodash.reject = reject;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.unzip = unzip;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    forOwn(lodash, function(func, methodName) {
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName] = function() {
          var args = [this.__wrapped__];
          push.apply(args, arguments);
          return func.apply(lodash, args);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(callback, thisArg) {
          var result = func(this.__wrapped__, callback, thisArg);
          return callback == null || (thisArg && typeof callback != 'function')
            ? result
            : new lodashWrapper(result);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type String
     */
    lodash.VERSION = '1.2.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return func.apply(this.__wrapped__, arguments);
      };
    });

    // add `Array` functions that return the wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments));
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash was injected by a third-party script and not intended to be
    // loaded as a module. The global assignment can be reverted in the Lo-Dash
    // module via its `noConflict()` method.
    window._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && !freeExports.nodeType) {
    // in Node.js or RingoJS v0.8.0+
    if (freeModule) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or RingoJS v0.7.0-
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    window._ = _;
  }
}(this));

},{}],4:[function(require,module,exports){
// moment.js
// version : 2.0.0
// author : Tim Wood
// license : MIT
// momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.0.0",
        round = Math.round, i,
        // internal storage for language config files
        languages = {},

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing tokens
        parseMultipleFormatChunker = /([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenWord = /[0-9]*[a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF]+\s*?[\u0600-\u06FF]+/i, // any word (or two) characters or numbers including two word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO seperator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        // preliminary iso regex
        // 0000-00-00 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000
        isoRegex = /^\s*\d{4}-\d\d-\d\d((T| )(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.S', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Month|Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return ~~(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(~~(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(a / 60), 2) + ":" + leftZeroFill(~~a % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(10 * a / 6), 4);
            },
            X    : function () {
                return this.unix();
            }
        };

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a));
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i]);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var data = this._data = {},
            years = duration.years || duration.year || duration.y || 0,
            months = duration.months || duration.month || duration.M || 0,
            weeks = duration.weeks || duration.week || duration.w || 0,
            days = duration.days || duration.day || duration.d || 0,
            hours = duration.hours || duration.hour || duration.h || 0,
            minutes = duration.minutes || duration.minute || duration.m || 0,
            seconds = duration.seconds || duration.second || duration.s || 0,
            milliseconds = duration.milliseconds || duration.millisecond || duration.ms || 0;

        // representation for dateAddRemove
        this._milliseconds = milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = months +
            years * 12;

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;
        seconds += absRound(milliseconds / 1000);

        data.seconds = seconds % 60;
        minutes += absRound(seconds / 60);

        data.minutes = minutes % 60;
        hours += absRound(minutes / 60);

        data.hours = hours % 24;
        days += absRound(hours / 24);

        days += weeks * 7;
        data.days = days % 30;

        months += absRound(days / 30);

        data.months = months % 12;
        years += absRound(months / 12);

        data.years = years;
    }


    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding) {
        var ms = duration._milliseconds,
            d = duration._days,
            M = duration._months,
            currentDate;

        if (ms) {
            mom._d.setTime(+mom + ms * isAdding);
        }
        if (d) {
            mom.date(mom.date() + d * isAdding);
        }
        if (M) {
            currentDate = mom.date();
            mom.date(1)
                .month(mom.month() + M * isAdding)
                .date(Math.min(currentDate, mom.daysInMonth()));
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (~~array1[i] !== ~~array2[i]) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }


    /************************************
        Languages
    ************************************/


    Language.prototype = {
        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex, output;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy);
        },
        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    };

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        if (!key) {
            return moment.fn._lang;
        }
        if (!languages[key] && hasModule) {
            require('./lang/' + key);
        }
        return languages[key];
    }


    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[.*\]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += typeof array[i].call === 'function' ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return m.lang().longDateFormat(input) || input;
        }

        while (i-- && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        }

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token) {
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
            return parseTokenFourDigits;
        case 'YYYYY':
            return parseTokenSixDigits;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'a':
        case 'A':
            return parseTokenWord;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
            return parseTokenOneOrTwoDigits;
        default :
            return new RegExp(token.replace('\\', ''));
        }
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, b,
            datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            datePartArray[1] = (input == null) ? 0 : ~~input - 1;
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[1] = a;
            } else {
                config._isValid = false;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DDDD
        case 'DD' : // fall through to DDDD
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                datePartArray[2] = ~~input;
            }
            break;
        // YEAR
        case 'YY' :
            datePartArray[0] = ~~input + (~~input > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
            datePartArray[0] = ~~input;
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = ((input + '').toLowerCase() === 'pm');
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[3] = ~~input;
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[4] = ~~input;
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[5] = ~~input;
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
            datePartArray[6] = ~~ (('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            a = (input + '').match(parseTimezoneChunker);
            if (a && a[1]) {
                config._tzh = ~~a[1];
            }
            if (a && a[2]) {
                config._tzm = ~~a[2];
            }
            // reverse offsets
            if (a && a[0] === '+') {
                config._tzh = -config._tzh;
                config._tzm = -config._tzm;
            }
            break;
        }

        // if the input is null, the date is not valid
        if (input == null) {
            config._isValid = false;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromArray(config) {
        var i, date, input = [];

        if (config._d) {
            return;
        }

        for (i = 0; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[3] += config._tzh || 0;
        input[4] += config._tzm || 0;

        date = new Date(0);

        if (config._useUTC) {
            date.setUTCFullYear(input[0], input[1], input[2]);
            date.setUTCHours(input[3], input[4], input[5], input[6]);
        } else {
            date.setFullYear(input[0], input[1], input[2]);
            date.setHours(input[3], input[4], input[5], input[6]);
        }

        config._d = date;
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var tokens = config._f.match(formattingTokens),
            string = config._i,
            i, parsedInput;

        config._a = [];

        for (i = 0; i < tokens.length; i++) {
            parsedInput = (getParseRegexForToken(tokens[i]).exec(string) || [])[0];
            if (parsedInput) {
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            }
            // don't parse if its not a known token
            if (formatTokenFunctions[tokens[i]]) {
                addTimeToArrayFromToken(tokens[i], parsedInput, config);
            }
        }
        // handle am pm
        if (config._isPm && config._a[3] < 12) {
            config._a[3] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[3] === 12) {
            config._a[3] = 0;
        }
        // return
        dateFromArray(config);
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            tempMoment,
            bestMoment,

            scoreToBeat = 99,
            i,
            currentDate,
            currentScore;

        while (config._f.length) {
            tempConfig = extend({}, config);
            tempConfig._f = config._f.pop();
            makeDateFromStringAndFormat(tempConfig);
            tempMoment = new Moment(tempConfig);

            if (tempMoment.isValid()) {
                bestMoment = tempMoment;
                break;
            }

            currentScore = compareArrays(tempConfig._a, tempMoment.toArray());

            if (currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempMoment;
            }
        }

        extend(config, bestMoment);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i,
            string = config._i;
        if (isoRegex.exec(string)) {
            config._f = 'YYYY-MM-DDT';
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (parseTokenTimezone.exec(string)) {
                config._f += " Z";
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromArray(config);
        } else {
            config._d = input instanceof Date ? new Date(+input) : new Date(input);
        }
    }


    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day();


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        return Math.ceil(moment(mom).add('d', daysToDayOfWeek).dayOfYear() / 7);
    }


    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || input === '') {
            return null;
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = extend({}, input);
            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang) {
        return makeMoment({
            _i : input,
            _f : format,
            _l : lang,
            _isUTC : false
        });
    };

    // creating with utc
    moment.utc = function (input, format, lang) {
        return makeMoment({
            _useUTC : true,
            _isUTC : true,
            _l : lang,
            _i : input,
            _f : format
        });
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var isDuration = moment.isDuration(input),
            isNumber = (typeof input === 'number'),
            duration = (isDuration ? input._data : (isNumber ? {} : input)),
            ret;

        if (isNumber) {
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        }

        ret = new Duration(duration);

        if (isDuration && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var i;

        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(key, values);
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };


    /************************************
        Moment Prototype
    ************************************/


    moment.fn = Moment.prototype = {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d;
        },

        unix : function () {
            return Math.floor(+this._d / 1000);
        },

        toString : function () {
            return this.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._d;
        },

        toJSON : function () {
            return moment.utc(this).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            if (this._isValid == null) {
                if (this._a) {
                    this._isValid = !compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray());
                } else {
                    this._isValid = !isNaN(this._d.getTime());
                }
            }
            return !!this._isValid;
        },

        utc : function () {
            this._isUTC = true;
            return this;
        },

        local : function () {
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = this._isUTC ? moment(input).utc() : moment(input).local(),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            if (units) {
                // standardize on singular form
                units = units.replace(/s$/, '');
            }

            if (units === 'year' || units === 'month') {
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                output += ((this - moment(this).startOf('month')) - (that - moment(that).startOf('month'))) / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that) - zoneDiff;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? diff / 864e5 : // 1000 * 60 * 60 * 24
                    units === 'week' ? diff / 6048e5 : // 1000 * 60 * 60 * 24 * 7
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().startOf('day'), 'days', true),
                format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isDST : function () {
            return (this.zone() < moment([this.year()]).zone() ||
                this.zone() < moment([this.year(), 5]).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            return input == null ? day :
                this.add({ d : input - day });
        },

        startOf: function (units) {
            units = units.replace(/s$/, '');
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.day(0);
            }

            return this;
        },

        endOf: function (units) {
            return this.startOf(units).add(units.replace(/s?$/, 's'), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) === +moment(input).startOf(units);
        },

        zone : function () {
            return this._isUTC ? 0 : this._d.getTimezoneOffset();
        },

        daysInMonth : function () {
            return moment.utc([this.year(), this.month() + 1, 0]).date();
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    };

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    /************************************
        Duration Prototype
    ************************************/


    moment.duration.fn = Duration.prototype = {
        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              this._months * 2592e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        lang : moment.fn.lang
    };

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });


    /************************************
        Exposing Moment
    ************************************/


    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    }
    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        this['moment'] = moment;
    }
    /*global define:false */
    if (typeof define === "function" && define.amd) {
        define("moment", [], function () {
            return moment;
        });
    }
}).call(this);

},{}],5:[function(require,module,exports){
// numeral.js
// version : 1.4.8
// author : Adam Draper
// license : MIT
// http://adamwdraper.github.com/Numeral-js/

(function () {

    /************************************
        Constants
    ************************************/

    var numeral,
        VERSION = '1.4.8',
        // internal storage for language config files
        languages = {},
        currentLanguage = 'en',
        zeroFormat = null,
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    // Numeral prototype object
    function Numeral (number) {
        this._n = number;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed (value, precision, optionals) {
        var power = Math.pow(10, precision),
            output;

        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (Math.round(value * power) / power).toFixed(precision);

        if (optionals) {
            var optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumeral (n, format) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, format);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n, format);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumeral (n, string) {
        if (string.indexOf(':') > -1) {
            n._n = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._n = 0;
            } else {
                var stringOriginal = string;
                if (languages[currentLanguage].delimiters.decimal !== '.') {
                    string = string.replace(/\./g,'').replace(languages[currentLanguage].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                var thousandRegExp = new RegExp(languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$'),
                    millionRegExp = new RegExp(languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$'),
                    billionRegExp = new RegExp(languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$'),
                    trillionRegExp = new RegExp(languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                var prefixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                    bytesMultiplier = false;

                for (var power = 0; power <= prefixes.length; power++) {
                    bytesMultiplier = (string.indexOf(prefixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                    if (bytesMultiplier) {
                        break;
                    }
                }

                // do some math to create our number
                n._n = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * Number(((string.indexOf('(') > -1) ? '-' : '') + string.replace(/[^0-9\.-]+/g, ''));

                // round if we are talking about bytes
                n._n = (bytesMultiplier) ? Math.ceil(n._n) : n._n;
            }
        }
        return n._n;
    }

    function formatCurrency (n, format) {
        var prependSymbol = (format.indexOf('$') <= 1) ? true : false;

        // remove $ for the moment
        var space = '';

        // check for space before or after currency
        if (format.indexOf(' $') > -1) {
            space = ' ';
            format = format.replace(' $', '');
        } else if (format.indexOf('$ ') > -1) {
            space = ' ';
            format = format.replace('$ ', '');
        } else {
            format = format.replace('$', '');
        }

        // format the number
        var output = formatNumeral(n, format);

        // position the symbol
        if (prependSymbol) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                output.splice(1, 0, languages[currentLanguage].currency.symbol + space);
                output = output.join('');
            } else {
                output = languages[currentLanguage].currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
                output = output.join('');
            } else {
                output = output + space + languages[currentLanguage].currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage (n, format) {
        var space = '';
        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        n._n = n._n * 100;
        var output = formatNumeral(n, format);
        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }
        return output;
    }

    function formatTime (n, format) {
        var hours = Math.floor(n._n/60/60),
            minutes = Math.floor((n._n - (hours * 60 * 60))/60),
            seconds = Math.round(n._n - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime (string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.lenght === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatNumber (n, format) {
        var negP = false,
            optDec = false,
            abbr = '',
            bytes = '',
            ord = '',
            abs = Math.abs(n._n);

        // check if number is zero and a custom zero format has been set
        if (n._n === 0 && zeroFormat !== null) {
            return zeroFormat;
        } else {
            // see if we should use parentheses for negative number
            if (format.indexOf('(') > -1) {
                negP = true;
                format = format.slice(1, -1);
            }

            // see if abbreviation is wanted
            if (format.indexOf('a') > -1) {
                // check for space before abbreviation
                if (format.indexOf(' a') > -1) {
                    abbr = ' ';
                    format = format.replace(' a', '');
                } else {
                    format = format.replace('a', '');
                }

                if (abs >= Math.pow(10, 12)) {
                    // trillion
                    abbr = abbr + languages[currentLanguage].abbreviations.trillion;
                    n._n = n._n / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
                    // billion
                    abbr = abbr + languages[currentLanguage].abbreviations.billion;
                    n._n = n._n / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
                    // million
                    abbr = abbr + languages[currentLanguage].abbreviations.million;
                    n._n = n._n / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
                    // thousand
                    abbr = abbr + languages[currentLanguage].abbreviations.thousand;
                    n._n = n._n / Math.pow(10, 3);
                }
            }

            // see if we are formatting bytes
            if (format.indexOf('b') > -1) {
                // check for space before
                if (format.indexOf(' b') > -1) {
                    bytes = ' ';
                    format = format.replace(' b', '');
                } else {
                    format = format.replace('b', '');
                }

                var prefixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                    min,
                    max;

                for (var power = 0; power <= prefixes.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (n._n >= min && n._n < max) {
                        bytes = bytes + prefixes[power];
                        if (min > 0) {
                            n._n = n._n / min;
                        }
                        break;
                    }
                }
            }

            // see if ordinal is wanted
            if (format.indexOf('o') > -1) {
                // check for space before
                if (format.indexOf(' o') > -1) {
                    ord = ' ';
                    format = format.replace(' o', '');
                } else {
                    format = format.replace('o', '');
                }

                ord = ord + languages[currentLanguage].ordinal(n._n);
            }

            if (format.indexOf('[.]') > -1) {
                optDec = true;
                format = format.replace('[.]', '.');
            }

            var w = n._n.toString().split('.')[0],
                precision = format.split('.')[1],
                thousands = format.indexOf(','),
                d = '',
                neg = false;

            if (precision) {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(n._n, (precision[0].length + precision[1].length), precision[1].length);
                } else {
                    d = toFixed(n._n, precision.length);
                }

                w = d.split('.')[0];

                if (d.split('.')[1].length) {
                    d = languages[currentLanguage].delimiters.decimal + d.split('.')[1];
                } else {
                    d = '';
                }

                if (optDec && Number(d.slice(1)) === 0) {
                    d = '';
                }
            } else {
                w = toFixed(n._n, null);
            }

            // format number
            if (w.indexOf('-') > -1) {
                w = w.slice(1);
                neg = true;
            }

            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
            }

            if (format.indexOf('.') === 0) {
                w = '';
            }

            return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
        }
    }

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (!Number(input)) {
            input = 0;
        }

        return new Numeral(Number(input));
    };

    // version number
    numeral.version = VERSION;

    // compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    numeral.language = function (key, values) {
        if (!key) {
            return currentLanguage;
        }

        if (key && !values) {
            if(!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            currentLanguage = key;
        }

        if (values || !languages[key]) {
            loadLanguage(key, values);
        }

        return numeral;
    };

    numeral.language('en', {
        delimiters: {
            thousands: ',',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });

    numeral.zeroFormat = function (format) {
        if (typeof(format) === 'string') {
            zeroFormat = format;
        } else {
            zeroFormat = null;
        }
    };

    /************************************
        Helpers
    ************************************/

    function loadLanguage(key, values) {
        languages[key] = values;
    }


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (inputString) {
            return formatNumeral(this, inputString ? inputString : numeral.defaultFormat);
        },

        unformat : function (inputString) {
            return unformatNumeral(this, inputString ? inputString : numeral.defaultFormat);
        },

        value : function () {
            return this._n;
        },

        valueOf : function () {
            return this._n;
        },

        set : function (value) {
            this._n = Number(value);
            return this;
        },

        add : function (value) {
            this._n = this._n + Number(value);
            return this;
        },

        subtract : function (value) {
            this._n = this._n - Number(value);
            return this;
        },

        multiply : function (value) {
            this._n = this._n * Number(value);
            return this;
        },

        divide : function (value) {
            this._n = this._n / Number(value);
            return this;
        },

        difference : function (value) {
            var difference = this._n - Number(value);

            if (difference < 0) {
                difference = -difference;
            }

            return difference;
        }

    };

    /************************************
        Exposing Numeral
    ************************************/

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numeral;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `numeral` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['numeral'] = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }
}).call(this);

},{}],6:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};"use strict";

var numeric = (typeof exports === "undefined")?(function numeric() {}):(exports);
if(typeof global !== "undefined") { global.numeric = numeric; }

numeric.version = "1.2.6";

// 1. Utility functions
numeric.bench = function bench (f,interval) {
    var t1,t2,n,i;
    if(typeof interval === "undefined") { interval = 15; }
    n = 0.5;
    t1 = new Date();
    while(1) {
        n*=2;
        for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
        while(i>0) { f(); i--; }
        t2 = new Date();
        if(t2-t1 > interval) break;
    }
    for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
    while(i>0) { f(); i--; }
    t2 = new Date();
    return 1000*(3*n-1)/(t2-t1);
}

numeric._myIndexOf = (function _myIndexOf(w) {
    var n = this.length,k;
    for(k=0;k<n;++k) if(this[k]===w) return k;
    return -1;
});
numeric.myIndexOf = (Array.prototype.indexOf)?Array.prototype.indexOf:numeric._myIndexOf;

numeric.Function = Function;
numeric.precision = 4;
numeric.largeArray = 50;

numeric.prettyPrint = function prettyPrint(x) {
    function fmtnum(x) {
        if(x === 0) { return '0'; }
        if(isNaN(x)) { return 'NaN'; }
        if(x<0) { return '-'+fmtnum(-x); }
        if(isFinite(x)) {
            var scale = Math.floor(Math.log(x) / Math.log(10));
            var normalized = x / Math.pow(10,scale);
            var basic = normalized.toPrecision(numeric.precision);
            if(parseFloat(basic) === 10) { scale++; normalized = 1; basic = normalized.toPrecision(numeric.precision); }
            return parseFloat(basic).toString()+'e'+scale.toString();
        }
        return 'Infinity';
    }
    var ret = [];
    function foo(x) {
        var k;
        if(typeof x === "undefined") { ret.push(Array(numeric.precision+8).join(' ')); return false; }
        if(typeof x === "string") { ret.push('"'+x+'"'); return false; }
        if(typeof x === "boolean") { ret.push(x.toString()); return false; }
        if(typeof x === "number") {
            var a = fmtnum(x);
            var b = x.toPrecision(numeric.precision);
            var c = parseFloat(x.toString()).toString();
            var d = [a,b,c,parseFloat(b).toString(),parseFloat(c).toString()];
            for(k=1;k<d.length;k++) { if(d[k].length < a.length) a = d[k]; }
            ret.push(Array(numeric.precision+8-a.length).join(' ')+a);
            return false;
        }
        if(x === null) { ret.push("null"); return false; }
        if(typeof x === "function") { 
            ret.push(x.toString());
            var flag = false;
            for(k in x) { if(x.hasOwnProperty(k)) { 
                if(flag) ret.push(',\n');
                else ret.push('\n{');
                flag = true; 
                ret.push(k); 
                ret.push(': \n'); 
                foo(x[k]); 
            } }
            if(flag) ret.push('}\n');
            return true;
        }
        if(x instanceof Array) {
            if(x.length > numeric.largeArray) { ret.push('...Large Array...'); return true; }
            var flag = false;
            ret.push('[');
            for(k=0;k<x.length;k++) { if(k>0) { ret.push(','); if(flag) ret.push('\n '); } flag = foo(x[k]); }
            ret.push(']');
            return true;
        }
        ret.push('{');
        var flag = false;
        for(k in x) { if(x.hasOwnProperty(k)) { if(flag) ret.push(',\n'); flag = true; ret.push(k); ret.push(': \n'); foo(x[k]); } }
        ret.push('}');
        return true;
    }
    foo(x);
    return ret.join('');
}

numeric.parseDate = function parseDate(d) {
    function foo(d) {
        if(typeof d === 'string') { return Date.parse(d.replace(/-/g,'/')); }
        if(!(d instanceof Array)) { throw new Error("parseDate: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseFloat = function parseFloat_(d) {
    function foo(d) {
        if(typeof d === 'string') { return parseFloat(d); }
        if(!(d instanceof Array)) { throw new Error("parseFloat: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseCSV = function parseCSV(t) {
    var foo = t.split('\n');
    var j,k;
    var ret = [];
    var pat = /(([^'",]*)|('[^']*')|("[^"]*")),/g;
    var patnum = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/;
    var stripper = function(n) { return n.substr(0,n.length-1); }
    var count = 0;
    for(k=0;k<foo.length;k++) {
      var bar = (foo[k]+",").match(pat),baz;
      if(bar.length>0) {
          ret[count] = [];
          for(j=0;j<bar.length;j++) {
              baz = stripper(bar[j]);
              if(patnum.test(baz)) { ret[count][j] = parseFloat(baz); }
              else ret[count][j] = baz;
          }
          count++;
      }
    }
    return ret;
}

numeric.toCSV = function toCSV(A) {
    var s = numeric.dim(A);
    var i,j,m,n,row,ret;
    m = s[0];
    n = s[1];
    ret = [];
    for(i=0;i<m;i++) {
        row = [];
        for(j=0;j<m;j++) { row[j] = A[i][j].toString(); }
        ret[i] = row.join(', ');
    }
    return ret.join('\n')+'\n';
}

numeric.getURL = function getURL(url) {
    var client = new XMLHttpRequest();
    client.open("GET",url,false);
    client.send();
    return client;
}

numeric.imageURL = function imageURL(img) {
    function base64(A) {
        var n = A.length, i,x,y,z,p,q,r,s;
        var key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var ret = "";
        for(i=0;i<n;i+=3) {
            x = A[i];
            y = A[i+1];
            z = A[i+2];
            p = x >> 2;
            q = ((x & 3) << 4) + (y >> 4);
            r = ((y & 15) << 2) + (z >> 6);
            s = z & 63;
            if(i+1>=n) { r = s = 64; }
            else if(i+2>=n) { s = 64; }
            ret += key.charAt(p) + key.charAt(q) + key.charAt(r) + key.charAt(s);
            }
        return ret;
    }
    function crc32Array (a,from,to) {
        if(typeof from === "undefined") { from = 0; }
        if(typeof to === "undefined") { to = a.length; }
        var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
                     0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 
                     0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
                     0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 
                     0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 
                     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 
                     0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
                     0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
                     0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
                     0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 
                     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 
                     0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 
                     0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 
                     0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 
                     0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 
                     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 
                     0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 
                     0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 
                     0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 
                     0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 
                     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 
                     0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 
                     0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 
                     0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 
                     0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 
                     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 
                     0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 
                     0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 
                     0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 
                     0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 
                     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 
                     0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
     
        var crc = -1, y = 0, n = a.length,i;

        for (i = from; i < to; i++) {
            y = (crc ^ a[i]) & 0xFF;
            crc = (crc >>> 8) ^ table[y];
        }
     
        return crc ^ (-1);
    }

    var h = img[0].length, w = img[0][0].length, s1, s2, next,k,length,a,b,i,j,adler32,crc32;
    var stream = [
                  137, 80, 78, 71, 13, 10, 26, 10,                           //  0: PNG signature
                  0,0,0,13,                                                  //  8: IHDR Chunk length
                  73, 72, 68, 82,                                            // 12: "IHDR" 
                  (w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w&255,   // 16: Width
                  (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h&255,   // 20: Height
                  8,                                                         // 24: bit depth
                  2,                                                         // 25: RGB
                  0,                                                         // 26: deflate
                  0,                                                         // 27: no filter
                  0,                                                         // 28: no interlace
                  -1,-2,-3,-4,                                               // 29: CRC
                  -5,-6,-7,-8,                                               // 33: IDAT Chunk length
                  73, 68, 65, 84,                                            // 37: "IDAT"
                  // RFC 1950 header starts here
                  8,                                                         // 41: RFC1950 CMF
                  29                                                         // 42: RFC1950 FLG
                  ];
    crc32 = crc32Array(stream,12,29);
    stream[29] = (crc32>>24)&255;
    stream[30] = (crc32>>16)&255;
    stream[31] = (crc32>>8)&255;
    stream[32] = (crc32)&255;
    s1 = 1;
    s2 = 0;
    for(i=0;i<h;i++) {
        if(i<h-1) { stream.push(0); }
        else { stream.push(1); }
        a = (3*w+1+(i===0))&255; b = ((3*w+1+(i===0))>>8)&255;
        stream.push(a); stream.push(b);
        stream.push((~a)&255); stream.push((~b)&255);
        if(i===0) stream.push(0);
        for(j=0;j<w;j++) {
            for(k=0;k<3;k++) {
                a = img[k][i][j];
                if(a>255) a = 255;
                else if(a<0) a=0;
                else a = Math.round(a);
                s1 = (s1 + a )%65521;
                s2 = (s2 + s1)%65521;
                stream.push(a);
            }
        }
        stream.push(0);
    }
    adler32 = (s2<<16)+s1;
    stream.push((adler32>>24)&255);
    stream.push((adler32>>16)&255);
    stream.push((adler32>>8)&255);
    stream.push((adler32)&255);
    length = stream.length - 41;
    stream[33] = (length>>24)&255;
    stream[34] = (length>>16)&255;
    stream[35] = (length>>8)&255;
    stream[36] = (length)&255;
    crc32 = crc32Array(stream,37);
    stream.push((crc32>>24)&255);
    stream.push((crc32>>16)&255);
    stream.push((crc32>>8)&255);
    stream.push((crc32)&255);
    stream.push(0);
    stream.push(0);
    stream.push(0);
    stream.push(0);
//    a = stream.length;
    stream.push(73);  // I
    stream.push(69);  // E
    stream.push(78);  // N
    stream.push(68);  // D
    stream.push(174); // CRC1
    stream.push(66);  // CRC2
    stream.push(96);  // CRC3
    stream.push(130); // CRC4
    return 'data:image/png;base64,'+base64(stream);
}

// 2. Linear algebra with Arrays.
numeric._dim = function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
}

numeric.dim = function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return numeric._dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
}

numeric.mapreduce = function mapreduce(body,init) {
    return Function('x','accum','_s','_k',
            'if(typeof accum === "undefined") accum = '+init+';\n'+
            'if(typeof x === "number") { var xi = x; '+body+'; return accum; }\n'+
            'if(typeof _s === "undefined") _s = numeric.dim(x);\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i,xi;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) {\n'+
            '        accum = arguments.callee(x[i],accum,_s,_k+1);\n'+
            '    }'+
            '    return accum;\n'+
            '}\n'+
            'for(i=_n-1;i>=1;i-=2) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '    xi = x[i-1];\n'+
            '    '+body+';\n'+
            '}\n'+
            'if(i === 0) {\n'+
            '    xi = x[i];\n'+
            '    '+body+'\n'+
            '}\n'+
            'return accum;'
            );
}
numeric.mapreduce2 = function mapreduce2(body,setup) {
    return Function('x',
            'var n = x.length;\n'+
            'var i,xi;\n'+setup+';\n'+
            'for(i=n-1;i!==-1;--i) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '}\n'+
            'return accum;'
            );
}


numeric.same = function same(x,y) {
    var i,n;
    if(!(x instanceof Array) || !(y instanceof Array)) { return false; }
    n = x.length;
    if(n !== y.length) { return false; }
    for(i=0;i<n;i++) {
        if(x[i] === y[i]) { continue; }
        if(typeof x[i] === "object") { if(!same(x[i],y[i])) return false; }
        else { return false; }
    }
    return true;
}

numeric.rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = numeric.rep(s,v,k+1); }
    return ret;
}


numeric.dotMMsmall = function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0;
    p = x.length; q = y.length; r = y[0].length;
    ret = Array(p);
    for(i=p-1;i>=0;i--) {
        foo = Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=1;j-=2) {
                i0 = j-1;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
            }
            if(j===0) { woo += bar[0]*y[0][k]; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
}
numeric._getCol = function _getCol(A,j,x) {
    var n = A.length, i;
    for(i=n-1;i>0;--i) {
        x[i] = A[i][j];
        --i;
        x[i] = A[i][j];
    }
    if(i===0) x[0] = A[0][j];
}
numeric.dotMMbig = function dotMMbig(x,y){
    var gc = numeric._getCol, p = y.length, v = Array(p);
    var m = x.length, n = y[0].length, A = new Array(m), xj;
    var VV = numeric.dotVV;
    var i,j,k,z;
    --p;
    --m;
    for(i=m;i!==-1;--i) A[i] = Array(n);
    --n;
    for(i=n;i!==-1;--i) {
        gc(y,i,v);
        for(j=m;j!==-1;--j) {
            z=0;
            xj = x[j];
            A[j][i] = VV(xj,v);
        }
    }
    return A;
}

numeric.dotMV = function dotMV(x,y) {
    var p = x.length, q = y.length,i;
    var ret = Array(p), dotVV = numeric.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
}

numeric.dotVM = function dotVM(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0,s1,s2,s3,baz,accum;
    p = x.length; q = y[0].length;
    ret = Array(q);
    for(k=q-1;k>=0;k--) {
        woo = x[p-1]*y[p-1][k];
        for(j=p-2;j>=1;j-=2) {
            i0 = j-1;
            woo += x[j]*y[j][k] + x[i0]*y[i0][k];
        }
        if(j===0) { woo += x[0]*y[0][k]; }
        ret[k] = woo;
    }
    return ret;
}

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,ret = x[n-1]*y[n-1];
    for(i=n-2;i>=1;i-=2) {
        i1 = i-1;
        ret += x[i]*y[i] + x[i1]*y[i1];
    }
    if(i===0) { ret += x[0]*y[0]; }
    return ret;
}

numeric.dot = function dot(x,y) {
    var d = numeric.dim;
    switch(d(x).length*1000+d(y).length) {
    case 2002:
        if(y.length < 10) return numeric.dotMMsmall(x,y);
        else return numeric.dotMMbig(x,y);
    case 2001: return numeric.dotMV(x,y);
    case 1002: return numeric.dotVM(x,y);
    case 1001: return numeric.dotVV(x,y);
    case 1000: return numeric.mulVS(x,y);
    case 1: return numeric.mulSV(x,y);
    case 0: return x*y;
    default: throw new Error('numeric.dot only works on vectors and matrices');
    }
}

numeric.diag = function diag(d) {
    var i,i1,j,n = d.length, A = Array(n), Ai;
    for(i=n-1;i>=0;i--) {
        Ai = Array(n);
        i1 = i+2;
        for(j=n-1;j>=i1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j>i) { Ai[j] = 0; }
        Ai[i] = d[i];
        for(j=i-1;j>=1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j===0) { Ai[0] = 0; }
        A[i] = Ai;
    }
    return A;
}
numeric.getDiag = function(A) {
    var n = Math.min(A.length,A[0].length),i,ret = Array(n);
    for(i=n-1;i>=1;--i) {
        ret[i] = A[i][i];
        --i;
        ret[i] = A[i][i];
    }
    if(i===0) {
        ret[0] = A[0][0];
    }
    return ret;
}

numeric.identity = function identity(n) { return numeric.diag(numeric.rep([n],1)); }
numeric.pointwise = function pointwise(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = '_s';
    fun[params.length+1] = '_k';
    fun[params.length+2] = (
            'if(typeof _s === "undefined") _s = numeric.dim('+thevec+');\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee('+params.join(',')+',_s,_k+1);\n'+
            '    return ret;\n'+
            '}\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            '    '+body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric.pointwise2 = function pointwise2(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = (
            'var _n = '+thevec+'.length;\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric._biforeach = (function _biforeach(x,y,s,k,f) {
    if(k === s.length-1) { f(x,y); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _biforeach(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
});
numeric._biforeach2 = (function _biforeach2(x,y,s,k,f) {
    if(k === s.length-1) { return f(x,y); }
    var i,n=s[k],ret = Array(n);
    for(i=n-1;i>=0;--i) { ret[i] = _biforeach2(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
    return ret;
});
numeric._foreach = (function _foreach(x,s,k,f) {
    if(k === s.length-1) { f(x); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _foreach(x[i],s,k+1,f); }
});
numeric._foreach2 = (function _foreach2(x,s,k,f) {
    if(k === s.length-1) { return f(x); }
    var i,n=s[k], ret = Array(n);
    for(i=n-1;i>=0;i--) { ret[i] = _foreach2(x[i],s,k+1,f); }
    return ret;
});

/*numeric.anyV = numeric.mapreduce('if(xi) return true;','false');
numeric.allV = numeric.mapreduce('if(!xi) return false;','true');
numeric.any = function(x) { if(typeof x.length === "undefined") return x; return numeric.anyV(x); }
numeric.all = function(x) { if(typeof x.length === "undefined") return x; return numeric.allV(x); }*/

numeric.ops2 = {
        add: '+',
        sub: '-',
        mul: '*',
        div: '/',
        mod: '%',
        and: '&&',
        or:  '||',
        eq:  '===',
        neq: '!==',
        lt:  '<',
        gt:  '>',
        leq: '<=',
        geq: '>=',
        band: '&',
        bor: '|',
        bxor: '^',
        lshift: '<<',
        rshift: '>>',
        rrshift: '>>>'
};
numeric.opseq = {
        addeq: '+=',
        subeq: '-=',
        muleq: '*=',
        diveq: '/=',
        modeq: '%=',
        lshifteq: '<<=',
        rshifteq: '>>=',
        rrshifteq: '>>>=',
        bandeq: '&=',
        boreq: '|=',
        bxoreq: '^='
};
numeric.mathfuns = ['abs','acos','asin','atan','ceil','cos',
                    'exp','floor','log','round','sin','sqrt','tan',
                    'isNaN','isFinite'];
numeric.mathfuns2 = ['atan2','pow','max','min'];
numeric.ops1 = {
        neg: '-',
        not: '!',
        bnot: '~',
        clone: ''
};
numeric.mapreducers = {
        any: ['if(xi) return true;','var accum = false;'],
        all: ['if(!xi) return false;','var accum = true;'],
        sum: ['accum += xi;','var accum = 0;'],
        prod: ['accum *= xi;','var accum = 1;'],
        norm2Squared: ['accum += xi*xi;','var accum = 0;'],
        norminf: ['accum = max(accum,abs(xi));','var accum = 0, max = Math.max, abs = Math.abs;'],
        norm1: ['accum += abs(xi)','var accum = 0, abs = Math.abs;'],
        sup: ['accum = max(accum,xi);','var accum = -Infinity, max = Math.max;'],
        inf: ['accum = min(accum,xi);','var accum = Infinity, min = Math.min;']
};

(function () {
    var i,o;
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        numeric.ops2[o] = o;
    }
    for(i in numeric.ops2) {
        if(numeric.ops2.hasOwnProperty(i)) {
            o = numeric.ops2[i];
            var code, codeeq, setup = '';
            if(numeric.myIndexOf.call(numeric.mathfuns2,i)!==-1) {
                setup = 'var '+o+' = Math.'+o+';\n';
                code = function(r,x,y) { return r+' = '+o+'('+x+','+y+')'; };
                codeeq = function(x,y) { return x+' = '+o+'('+x+','+y+')'; };
            } else {
                code = function(r,x,y) { return r+' = '+x+' '+o+' '+y; };
                if(numeric.opseq.hasOwnProperty(i+'eq')) {
                    codeeq = function(x,y) { return x+' '+o+'= '+y; };
                } else {
                    codeeq = function(x,y) { return x+' = '+x+' '+o+' '+y; };                    
                }
            }
            numeric[i+'VV'] = numeric.pointwise2(['x[i]','y[i]'],code('ret[i]','x[i]','y[i]'),setup);
            numeric[i+'SV'] = numeric.pointwise2(['x','y[i]'],code('ret[i]','x','y[i]'),setup);
            numeric[i+'VS'] = numeric.pointwise2(['x[i]','y'],code('ret[i]','x[i]','y'),setup);
            numeric[i] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var VV = numeric.'+i+'VV, VS = numeric.'+i+'VS, SV = numeric.'+i+'SV;\n'+
                    'var dim = numeric.dim;\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof x === "object") {\n'+
                    '      if(typeof y === "object") x = numeric._biforeach2(x,y,dim(x),0,VV);\n'+
                    '      else x = numeric._biforeach2(x,y,dim(x),0,VS);\n'+
                    '  } else if(typeof y === "object") x = numeric._biforeach2(x,y,dim(y),0,SV);\n'+
                    '  else '+codeeq('x','y')+'\n'+
                    '}\nreturn x;\n');
            numeric[o] = numeric[i];
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]','x[i]'], codeeq('ret[i]','x[i]'),setup);
            numeric[i+'eqS'] = numeric.pointwise2(['ret[i]','x'], codeeq('ret[i]','x'),setup);
            numeric[i+'eq'] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var V = numeric.'+i+'eqV, S = numeric.'+i+'eqS\n'+
                    'var s = numeric.dim(x);\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof y === "object") numeric._biforeach(x,y,s,0,V);\n'+
                    '  else numeric._biforeach(x,y,s,0,S);\n'+
                    '}\nreturn x;\n');
        }
    }
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        delete numeric.ops2[o];
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        numeric.ops1[o] = o;
    }
    for(i in numeric.ops1) {
        if(numeric.ops1.hasOwnProperty(i)) {
            setup = '';
            o = numeric.ops1[i];
            if(numeric.myIndexOf.call(numeric.mathfuns,i)!==-1) {
                if(Math.hasOwnProperty(o)) setup = 'var '+o+' = Math.'+o+';\n';
            }
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]'],'ret[i] = '+o+'(ret[i]);',setup);
            numeric[i+'eq'] = Function('x',
                    'if(typeof x !== "object") return '+o+'x\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'eqV;\n'+
                    'var s = numeric.dim(x);\n'+
                    'numeric._foreach(x,s,0,V);\n'+
                    'return x;\n');
            numeric[i+'V'] = numeric.pointwise2(['x[i]'],'ret[i] = '+o+'(x[i]);',setup);
            numeric[i] = Function('x',
                    'if(typeof x !== "object") return '+o+'(x)\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'V;\n'+
                    'var s = numeric.dim(x);\n'+
                    'return numeric._foreach2(x,s,0,V);\n');
        }
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        delete numeric.ops1[o];
    }
    for(i in numeric.mapreducers) {
        if(numeric.mapreducers.hasOwnProperty(i)) {
            o = numeric.mapreducers[i];
            numeric[i+'V'] = numeric.mapreduce2(o[0],o[1]);
            numeric[i] = Function('x','s','k',
                    o[1]+
                    'if(typeof x !== "object") {'+
                    '    xi = x;\n'+
                    o[0]+';\n'+
                    '    return accum;\n'+
                    '}'+
                    'if(typeof s === "undefined") s = numeric.dim(x);\n'+
                    'if(typeof k === "undefined") k = 0;\n'+
                    'if(k === s.length-1) return numeric.'+i+'V(x);\n'+
                    'var xi;\n'+
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i!==-1;--i) {\n'+
                    '   xi = arguments.callee(x[i]);\n'+
                    o[0]+';\n'+
                    '}\n'+
                    'return accum;\n');
        }
    }
}());

numeric.truncVV = numeric.pointwise(['x[i]','y[i]'],'ret[i] = round(x[i]/y[i])*y[i];','var round = Math.round;');
numeric.truncVS = numeric.pointwise(['x[i]','y'],'ret[i] = round(x[i]/y)*y;','var round = Math.round;');
numeric.truncSV = numeric.pointwise(['x','y[i]'],'ret[i] = round(x/y[i])*y[i];','var round = Math.round;');
numeric.trunc = function trunc(x,y) {
    if(typeof x === "object") {
        if(typeof y === "object") return numeric.truncVV(x,y);
        return numeric.truncVS(x,y);
    }
    if (typeof y === "object") return numeric.truncSV(x,y);
    return Math.round(x/y)*y;
}

numeric.inv = function inv(x) {
    var s = numeric.dim(x), abs = Math.abs, m = s[0], n = s[1];
    var A = numeric.clone(x), Ai, Aj;
    var I = numeric.identity(m), Ii, Ij;
    var i,j,k,x;
    for(j=0;j<n;++j) {
        var i0 = -1;
        var v0 = -1;
        for(i=j;i!==m;++i) { k = abs(A[i][j]); if(k>v0) { i0 = i; v0 = k; } }
        Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
        Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
        x = Aj[j];
        for(k=j;k!==n;++k)    Aj[k] /= x; 
        for(k=n-1;k!==-1;--k) Ij[k] /= x;
        for(i=m-1;i!==-1;--i) {
            if(i!==j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for(k=j+1;k!==n;++k)  Ai[k] -= Aj[k]*x;
                for(k=n-1;k>0;--k) { Ii[k] -= Ij[k]*x; --k; Ii[k] -= Ij[k]*x; }
                if(k===0) Ii[0] -= Ij[0]*x;
            }
        }
    }
    return I;
}

numeric.det = function det(x) {
    var s = numeric.dim(x);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: det() only works on square matrices'); }
    var n = s[0], ret = 1,i,j,k,A = numeric.clone(x),Aj,Ai,alpha,temp,k1,k2,k3;
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(Math.abs(A[i][j]) > Math.abs(A[k][j])) { k = i; } }
        if(k !== j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            ret *= -1;
        }
        Aj = A[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-1;k+=2) {
                k1 = k+1;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
            }
            if(k!==n) { Ai[k] -= Aj[k]*alpha; }
        }
        if(Aj[j] === 0) { return 0; }
        ret *= Aj[j];
    }
    return ret*A[j][j];
}

numeric.transpose = function transpose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
            --j;
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = A1[0]; Bj[i-1] = A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = A0[j];
            --j;
            ret[j][0] = A0[j];
        }
        if(j===0) { ret[0][0] = A0[0]; }
    }
    return ret;
}
numeric.negtranspose = function negtranspose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
            --j;
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = -A1[0]; Bj[i-1] = -A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = -A0[j];
            --j;
            ret[j][0] = -A0[j];
        }
        if(j===0) { ret[0][0] = -A0[0]; }
    }
    return ret;
}

numeric._random = function _random(s,k) {
    var i,n=s[k],ret=Array(n), rnd;
    if(k === s.length-1) {
        rnd = Math.random;
        for(i=n-1;i>=1;i-=2) {
            ret[i] = rnd();
            ret[i-1] = rnd();
        }
        if(i===0) { ret[0] = rnd(); }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = _random(s,k+1);
    return ret;
}
numeric.random = function random(s) { return numeric._random(s,0); }

numeric.norm2 = function norm2(x) { return Math.sqrt(numeric.norm2Squared(x)); }

numeric.linspace = function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}

numeric.getBlock = function getBlock(x,from,to) {
    var s = numeric.dim(x);
    function foo(x,k) {
        var i,a = from[k], n = to[k]-a, ret = Array(n);
        if(k === s.length-1) {
            for(i=n;i>=0;i--) { ret[i] = x[i+a]; }
            return ret;
        }
        for(i=n;i>=0;i--) { ret[i] = foo(x[i+a],k+1); }
        return ret;
    }
    return foo(x,0);
}

numeric.setBlock = function setBlock(x,from,to,B) {
    var s = numeric.dim(x);
    function foo(x,y,k) {
        var i,a = from[k], n = to[k]-a;
        if(k === s.length-1) { for(i=n;i>=0;i--) { x[i+a] = y[i]; } }
        for(i=n;i>=0;i--) { foo(x[i+a],y[i],k+1); }
    }
    foo(x,B,0);
    return x;
}

numeric.getRange = function getRange(A,I,J) {
    var m = I.length, n = J.length;
    var i,j;
    var B = Array(m), Bi, AI;
    for(i=m-1;i!==-1;--i) {
        B[i] = Array(n);
        Bi = B[i];
        AI = A[I[i]];
        for(j=n-1;j!==-1;--j) Bi[j] = AI[J[j]];
    }
    return B;
}

numeric.blockMatrix = function blockMatrix(X) {
    var s = numeric.dim(X);
    if(s.length<4) return numeric.blockMatrix([X]);
    var m=s[0],n=s[1],M,N,i,j,Xij;
    M = 0; N = 0;
    for(i=0;i<m;++i) M+=X[i][0].length;
    for(j=0;j<n;++j) N+=X[0][j][0].length;
    var Z = Array(M);
    for(i=0;i<M;++i) Z[i] = Array(N);
    var I=0,J,ZI,k,l,Xijk;
    for(i=0;i<m;++i) {
        J=N;
        for(j=n-1;j!==-1;--j) {
            Xij = X[i][j];
            J -= Xij[0].length;
            for(k=Xij.length-1;k!==-1;--k) {
                Xijk = Xij[k];
                ZI = Z[I+k];
                for(l = Xijk.length-1;l!==-1;--l) ZI[J+l] = Xijk[l];
            }
        }
        I += X[i][0].length;
    }
    return Z;
}

numeric.tensor = function tensor(x,y) {
    if(typeof x === "number" || typeof y === "number") return numeric.mul(x,y);
    var s1 = numeric.dim(x), s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
        throw new Error('numeric: tensor product is only defined for vectors');
    }
    var m = s1[0], n = s2[0], A = Array(m), Ai, i,j,xi;
    for(i=m-1;i>=0;i--) {
        Ai = Array(n);
        xi = x[i];
        for(j=n-1;j>=3;--j) {
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
        }
        while(j>=0) { Ai[j] = xi * y[j]; --j; }
        A[i] = Ai;
    }
    return A;
}

// 3. The Tensor type T
numeric.T = function T(x,y) { this.x = x; this.y = y; }
numeric.t = function t(x,y) { return new numeric.T(x,y); }

numeric.Tbinop = function Tbinop(rr,rc,cr,cc,setup) {
    var io = numeric.indexOf;
    if(typeof setup !== "string") {
        var k;
        setup = '';
        for(k in numeric) {
            if(numeric.hasOwnProperty(k) && (rr.indexOf(k)>=0 || rc.indexOf(k)>=0 || cr.indexOf(k)>=0 || cc.indexOf(k)>=0) && k.length>1) {
                setup += 'var '+k+' = numeric.'+k+';\n';
            }
        }
    }
    return Function(['y'],
            'var x = this;\n'+
            'if(!(y instanceof numeric.T)) { y = new numeric.T(y); }\n'+
            setup+'\n'+
            'if(x.y) {'+
            '  if(y.y) {'+
            '    return new numeric.T('+cc+');\n'+
            '  }\n'+
            '  return new numeric.T('+cr+');\n'+
            '}\n'+
            'if(y.y) {\n'+
            '  return new numeric.T('+rc+');\n'+
            '}\n'+
            'return new numeric.T('+rr+');\n'
    );
}

numeric.T.prototype.add = numeric.Tbinop(
        'add(x.x,y.x)',
        'add(x.x,y.x),y.y',
        'add(x.x,y.x),x.y',
        'add(x.x,y.x),add(x.y,y.y)');
numeric.T.prototype.sub = numeric.Tbinop(
        'sub(x.x,y.x)',
        'sub(x.x,y.x),neg(y.y)',
        'sub(x.x,y.x),x.y',
        'sub(x.x,y.x),sub(x.y,y.y)');
numeric.T.prototype.mul = numeric.Tbinop(
        'mul(x.x,y.x)',
        'mul(x.x,y.x),mul(x.x,y.y)',
        'mul(x.x,y.x),mul(x.y,y.x)',
        'sub(mul(x.x,y.x),mul(x.y,y.y)),add(mul(x.x,y.y),mul(x.y,y.x))');

numeric.T.prototype.reciprocal = function reciprocal() {
    var mul = numeric.mul, div = numeric.div;
    if(this.y) {
        var d = numeric.add(mul(this.x,this.x),mul(this.y,this.y));
        return new numeric.T(div(this.x,d),div(numeric.neg(this.y),d));
    }
    return new T(div(1,this.x));
}
numeric.T.prototype.div = function div(y) {
    if(!(y instanceof numeric.T)) y = new numeric.T(y);
    if(y.y) { return this.mul(y.reciprocal()); }
    var div = numeric.div;
    if(this.y) { return new numeric.T(div(this.x,y.x),div(this.y,y.x)); }
    return new numeric.T(div(this.x,y.x));
}
numeric.T.prototype.dot = numeric.Tbinop(
        'dot(x.x,y.x)',
        'dot(x.x,y.x),dot(x.x,y.y)',
        'dot(x.x,y.x),dot(x.y,y.x)',
        'sub(dot(x.x,y.x),dot(x.y,y.y)),add(dot(x.x,y.y),dot(x.y,y.x))'
        );
numeric.T.prototype.transpose = function transpose() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),t(y)); }
    return new numeric.T(t(x));
}
numeric.T.prototype.transjugate = function transjugate() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),numeric.negtranspose(y)); }
    return new numeric.T(t(x));
}
numeric.Tunop = function Tunop(r,c,s) {
    if(typeof s !== "string") { s = ''; }
    return Function(
            'var x = this;\n'+
            s+'\n'+
            'if(x.y) {'+
            '  '+c+';\n'+
            '}\n'+
            r+';\n'
    );
}

numeric.T.prototype.exp = numeric.Tunop(
        'return new numeric.T(ex)',
        'return new numeric.T(mul(cos(x.y),ex),mul(sin(x.y),ex))',
        'var ex = numeric.exp(x.x), cos = numeric.cos, sin = numeric.sin, mul = numeric.mul;');
numeric.T.prototype.conj = numeric.Tunop(
        'return new numeric.T(x.x);',
        'return new numeric.T(x.x,numeric.neg(x.y));');
numeric.T.prototype.neg = numeric.Tunop(
        'return new numeric.T(neg(x.x));',
        'return new numeric.T(neg(x.x),neg(x.y));',
        'var neg = numeric.neg;');
numeric.T.prototype.sin = numeric.Tunop(
        'return new numeric.T(numeric.sin(x.x))',
        'return x.exp().sub(x.neg().exp()).div(new numeric.T(0,2));');
numeric.T.prototype.cos = numeric.Tunop(
        'return new numeric.T(numeric.cos(x.x))',
        'return x.exp().add(x.neg().exp()).div(2);');
numeric.T.prototype.abs = numeric.Tunop(
        'return new numeric.T(numeric.abs(x.x));',
        'return new numeric.T(numeric.sqrt(numeric.add(mul(x.x,x.x),mul(x.y,x.y))));',
        'var mul = numeric.mul;');
numeric.T.prototype.log = numeric.Tunop(
        'return new numeric.T(numeric.log(x.x));',
        'var theta = new numeric.T(numeric.atan2(x.y,x.x)), r = x.abs();\n'+
        'return new numeric.T(numeric.log(r.x),theta.x);');
numeric.T.prototype.norm2 = numeric.Tunop(
        'return numeric.norm2(x.x);',
        'var f = numeric.norm2Squared;\n'+
        'return Math.sqrt(f(x.x)+f(x.y));');
numeric.T.prototype.inv = function inv() {
    var A = this;
    if(typeof A.y === "undefined") { return new numeric.T(numeric.inv(A.x)); }
    var n = A.x.length, i, j, k;
    var Rx = numeric.identity(n),Ry = numeric.rep([n,n],0);
    var Ax = numeric.clone(A.x), Ay = numeric.clone(A.y);
    var Aix, Aiy, Ajx, Ajy, Rix, Riy, Rjx, Rjy;
    var i,j,k,d,d1,ax,ay,bx,by,temp;
    for(i=0;i<n;i++) {
        ax = Ax[i][i]; ay = Ay[i][i];
        d = ax*ax+ay*ay;
        k = i;
        for(j=i+1;j<n;j++) {
            ax = Ax[j][i]; ay = Ay[j][i];
            d1 = ax*ax+ay*ay;
            if(d1 > d) { k=j; d = d1; }
        }
        if(k!==i) {
            temp = Ax[i]; Ax[i] = Ax[k]; Ax[k] = temp;
            temp = Ay[i]; Ay[i] = Ay[k]; Ay[k] = temp;
            temp = Rx[i]; Rx[i] = Rx[k]; Rx[k] = temp;
            temp = Ry[i]; Ry[i] = Ry[k]; Ry[k] = temp;
        }
        Aix = Ax[i]; Aiy = Ay[i];
        Rix = Rx[i]; Riy = Ry[i];
        ax = Aix[i]; ay = Aiy[i];
        for(j=i+1;j<n;j++) {
            bx = Aix[j]; by = Aiy[j];
            Aix[j] = (bx*ax+by*ay)/d;
            Aiy[j] = (by*ax-bx*ay)/d;
        }
        for(j=0;j<n;j++) {
            bx = Rix[j]; by = Riy[j];
            Rix[j] = (bx*ax+by*ay)/d;
            Riy[j] = (by*ax-bx*ay)/d;
        }
        for(j=i+1;j<n;j++) {
            Ajx = Ax[j]; Ajy = Ay[j];
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ajx[i]; ay = Ajy[i];
            for(k=i+1;k<n;k++) {
                bx = Aix[k]; by = Aiy[k];
                Ajx[k] -= bx*ax-by*ay;
                Ajy[k] -= by*ax+bx*ay;
            }
            for(k=0;k<n;k++) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= bx*ax-by*ay;
                Rjy[k] -= by*ax+bx*ay;
            }
        }
    }
    for(i=n-1;i>0;i--) {
        Rix = Rx[i]; Riy = Ry[i];
        for(j=i-1;j>=0;j--) {
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ax[j][i]; ay = Ay[j][i];
            for(k=n-1;k>=0;k--) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= ax*bx - ay*by;
                Rjy[k] -= ax*by + ay*bx;
            }
        }
    }
    return new numeric.T(Rx,Ry);
}
numeric.T.prototype.get = function get(i) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length;
    if(y) {
        while(k<n) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        return new numeric.T(x,y);
    }
    while(k<n) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    return new numeric.T(x);
}
numeric.T.prototype.set = function set(i,v) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length, vx = v.x, vy = v.y;
    if(n===0) {
        if(vy) { this.y = vy; }
        else if(y) { this.y = undefined; }
        this.x = x;
        return this;
    }
    if(vy) {
        if(y) { /* ok */ }
        else {
            y = numeric.rep(numeric.dim(x),0);
            this.y = y;
        }
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        y[ik] = vy;
        return this;
    }
    if(y) {
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        if(vx instanceof Array) y[ik] = numeric.rep(numeric.dim(vx),0);
        else y[ik] = 0;
        return this;
    }
    while(k<n-1) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    ik = i[k];
    x[ik] = vx;
    return this;
}
numeric.T.prototype.getRows = function getRows(i0,i1) {
    var n = i1-i0+1, j;
    var rx = Array(n), ry, x = this.x, y = this.y;
    for(j=i0;j<=i1;j++) { rx[j-i0] = x[j]; }
    if(y) {
        ry = Array(n);
        for(j=i0;j<=i1;j++) { ry[j-i0] = y[j]; }
        return new numeric.T(rx,ry);
    }
    return new numeric.T(rx);
}
numeric.T.prototype.setRows = function setRows(i0,i1,A) {
    var j;
    var rx = this.x, ry = this.y, x = A.x, y = A.y;
    for(j=i0;j<=i1;j++) { rx[j] = x[j-i0]; }
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        for(j=i0;j<=i1;j++) { ry[j] = y[j-i0]; }
    } else if(ry) {
        for(j=i0;j<=i1;j++) { ry[j] = numeric.rep([x[j-i0].length],0); }
    }
    return this;
}
numeric.T.prototype.getRow = function getRow(k) {
    var x = this.x, y = this.y;
    if(y) { return new numeric.T(x[k],y[k]); }
    return new numeric.T(x[k]);
}
numeric.T.prototype.setRow = function setRow(i,v) {
    var rx = this.x, ry = this.y, x = v.x, y = v.y;
    rx[i] = x;
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        ry[i] = y;
    } else if(ry) {
        ry = numeric.rep([x.length],0);
    }
    return this;
}

numeric.T.prototype.getBlock = function getBlock(from,to) {
    var x = this.x, y = this.y, b = numeric.getBlock;
    if(y) { return new numeric.T(b(x,from,to),b(y,from,to)); }
    return new numeric.T(b(x,from,to));
}
numeric.T.prototype.setBlock = function setBlock(from,to,A) {
    if(!(A instanceof numeric.T)) A = new numeric.T(A);
    var x = this.x, y = this.y, b = numeric.setBlock, Ax = A.x, Ay = A.y;
    if(Ay) {
        if(!y) { this.y = numeric.rep(numeric.dim(this),0); y = this.y; }
        b(x,from,to,Ax);
        b(y,from,to,Ay);
        return this;
    }
    b(x,from,to,Ax);
    if(y) b(y,from,to,numeric.rep(numeric.dim(Ax),0));
}
numeric.T.rep = function rep(s,v) {
    var T = numeric.T;
    if(!(v instanceof T)) v = new T(v);
    var x = v.x, y = v.y, r = numeric.rep;
    if(y) return new T(r(s,x),r(s,y));
    return new T(r(s,x));
}
numeric.T.diag = function diag(d) {
    if(!(d instanceof numeric.T)) d = new numeric.T(d);
    var x = d.x, y = d.y, diag = numeric.diag;
    if(y) return new numeric.T(diag(x),diag(y));
    return new numeric.T(diag(x));
}
numeric.T.eig = function eig() {
    if(this.y) { throw new Error('eig: not implemented for complex matrices.'); }
    return numeric.eig(this.x);
}
numeric.T.identity = function identity(n) { return new numeric.T(numeric.identity(n)); }
numeric.T.prototype.getDiag = function getDiag() {
    var n = numeric;
    var x = this.x, y = this.y;
    if(y) { return new n.T(n.getDiag(x),n.getDiag(y)); }
    return new n.T(n.getDiag(x));
}

// 4. Eigenvalues of real matrices

numeric.house = function house(x) {
    var v = numeric.clone(x);
    var s = x[0] >= 0 ? 1 : -1;
    var alpha = s*numeric.norm2(x);
    v[0] += alpha;
    var foo = numeric.norm2(v);
    if(foo === 0) { /* this should not happen */ throw new Error('eig: internal error'); }
    return numeric.div(v,foo);
}

numeric.toUpperHessenberg = function toUpperHessenberg(me) {
    var s = numeric.dim(me);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: toUpperHessenberg() only works on square matrices'); }
    var m = s[0], i,j,k,x,v,A = numeric.clone(me),B,C,Ai,Ci,Q = numeric.identity(m),Qi;
    for(j=0;j<m-2;j++) {
        x = Array(m-j-1);
        for(i=j+1;i<m;i++) { x[i-j-1] = A[i][j]; }
        if(numeric.norm2(x)>0) {
            v = numeric.house(x);
            B = numeric.getBlock(A,[j+1,j],[m-1,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Ai = A[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Ai[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(A,[0,j+1],[m-1,m-1]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Ai = A[i]; Ci = C[i]; for(k=j+1;k<m;k++) Ai[k] -= 2*Ci[k-j-1]; }
            B = Array(m-j-1);
            for(i=j+1;i<m;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    return {H:A, Q:Q};
}

numeric.epsilon = 2.220446049250313e-16;

numeric.QRFrancis = function(H,maxiter) {
    if(typeof maxiter === "undefined") { maxiter = 10000; }
    H = numeric.clone(H);
    var H0 = numeric.clone(H);
    var s = numeric.dim(H),m=s[0],x,v,a,b,c,d,det,tr, Hloc, Q = numeric.identity(m), Qi, Hi, B, C, Ci,i,j,k,iter;
    if(m<3) { return {Q:Q, B:[ [0,m-1] ]}; }
    var epsilon = numeric.epsilon;
    for(iter=0;iter<maxiter;iter++) {
        for(j=0;j<m-1;j++) {
            if(Math.abs(H[j+1][j]) < epsilon*(Math.abs(H[j][j])+Math.abs(H[j+1][j+1]))) {
                var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[j,j]),maxiter);
                var QH2 = numeric.QRFrancis(numeric.getBlock(H,[j+1,j+1],[m-1,m-1]),maxiter);
                B = Array(j+1);
                for(i=0;i<=j;i++) { B[i] = Q[i]; }
                C = numeric.dot(QH1.Q,B);
                for(i=0;i<=j;i++) { Q[i] = C[i]; }
                B = Array(m-j-1);
                for(i=j+1;i<m;i++) { B[i-j-1] = Q[i]; }
                C = numeric.dot(QH2.Q,B);
                for(i=j+1;i<m;i++) { Q[i] = C[i-j-1]; }
                return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,j+1))};
            }
        }
        a = H[m-2][m-2]; b = H[m-2][m-1];
        c = H[m-1][m-2]; d = H[m-1][m-1];
        tr = a+d;
        det = (a*d-b*c);
        Hloc = numeric.getBlock(H, [0,0], [2,2]);
        if(tr*tr>=4*det) {
            var s1,s2;
            s1 = 0.5*(tr+Math.sqrt(tr*tr-4*det));
            s2 = 0.5*(tr-Math.sqrt(tr*tr-4*det));
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,s1+s2)),
                               numeric.diag(numeric.rep([3],s1*s2)));
        } else {
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,tr)),
                               numeric.diag(numeric.rep([3],det)));
        }
        x = [Hloc[0][0],Hloc[1][0],Hloc[2][0]];
        v = numeric.house(x);
        B = [H[0],H[1],H[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<m;k++) Hi[k] -= 2*Ci[k]; }
        B = numeric.getBlock(H, [0,0],[m-1,2]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<3;k++) Hi[k] -= 2*Ci[k]; }
        B = [Q[0],Q[1],Q[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Qi = Q[i]; Ci = C[i]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        var J;
        for(j=0;j<m-2;j++) {
            for(k=j;k<=j+1;k++) {
                if(Math.abs(H[k+1][k]) < epsilon*(Math.abs(H[k][k])+Math.abs(H[k+1][k+1]))) {
                    var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[k,k]),maxiter);
                    var QH2 = numeric.QRFrancis(numeric.getBlock(H,[k+1,k+1],[m-1,m-1]),maxiter);
                    B = Array(k+1);
                    for(i=0;i<=k;i++) { B[i] = Q[i]; }
                    C = numeric.dot(QH1.Q,B);
                    for(i=0;i<=k;i++) { Q[i] = C[i]; }
                    B = Array(m-k-1);
                    for(i=k+1;i<m;i++) { B[i-k-1] = Q[i]; }
                    C = numeric.dot(QH2.Q,B);
                    for(i=k+1;i<m;i++) { Q[i] = C[i-k-1]; }
                    return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,k+1))};
                }
            }
            J = Math.min(m-1,j+3);
            x = Array(J-j);
            for(i=j+1;i<=J;i++) { x[i-j-1] = H[i][j]; }
            v = numeric.house(x);
            B = numeric.getBlock(H, [j+1,j],[J,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Hi = H[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Hi[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(H, [0,j+1],[m-1,J]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=j+1;k<=J;k++) Hi[k] -= 2*Ci[k-j-1]; }
            B = Array(J-j);
            for(i=j+1;i<=J;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    throw new Error('numeric: eigenvalue iteration does not converge -- increase maxiter?');
}

numeric.eig = function eig(A,maxiter) {
    var QH = numeric.toUpperHessenberg(A);
    var QB = numeric.QRFrancis(QH.H,maxiter);
    var T = numeric.T;
    var n = A.length,i,k,flag = false,B = QB.B,H = numeric.dot(QB.Q,numeric.dot(QH.H,numeric.transpose(QB.Q)));
    var Q = new T(numeric.dot(QB.Q,QH.Q)),Q0;
    var m = B.length,j;
    var a,b,c,d,p1,p2,disc,x,y,p,q,n1,n2;
    var sqrt = Math.sqrt;
    for(k=0;k<m;k++) {
        i = B[k][0];
        if(i === B[k][1]) {
            // nothing
        } else {
            j = i+1;
            a = H[i][i];
            b = H[i][j];
            c = H[j][i];
            d = H[j][j];
            if(b === 0 && c === 0) continue;
            p1 = -a-d;
            p2 = a*d-b*c;
            disc = p1*p1-4*p2;
            if(disc>=0) {
                if(p1<0) x = -0.5*(p1-sqrt(disc));
                else     x = -0.5*(p1+sqrt(disc));
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1);
                    p = (a-x)/n1;
                    q = b/n1;
                } else {
                    n2 = sqrt(n2);
                    p = c/n2;
                    q = (d-x)/n2;
                }
                Q0 = new T([[q,-p],[p,q]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            } else {
                x = -0.5*p1;
                y = 0.5*sqrt(-disc);
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1+y*y);
                    p = (a-x)/n1;
                    q = b/n1;
                    x = 0;
                    y /= n1;
                } else {
                    n2 = sqrt(n2+y*y);
                    p = c/n2;
                    q = (d-x)/n2;
                    x = y/n2;
                    y = 0;
                }
                Q0 = new T([[q,-p],[p,q]],[[x,y],[y,-x]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            }
        }
    }
    var R = Q.dot(A).dot(Q.transjugate()), n = A.length, E = numeric.T.identity(n);
    for(j=0;j<n;j++) {
        if(j>0) {
            for(k=j-1;k>=0;k--) {
                var Rk = R.get([k,k]), Rj = R.get([j,j]);
                if(numeric.neq(Rk.x,Rj.x) || numeric.neq(Rk.y,Rj.y)) {
                    x = R.getRow(k).getBlock([k],[j-1]);
                    y = E.getRow(j).getBlock([k],[j-1]);
                    E.set([j,k],(R.get([k,j]).neg().sub(x.dot(y))).div(Rk.sub(Rj)));
                } else {
                    E.setRow(j,E.getRow(k));
                    continue;
                }
            }
        }
    }
    for(j=0;j<n;j++) {
        x = E.getRow(j);
        E.setRow(j,x.div(x.norm2()));
    }
    E = E.transpose();
    E = Q.transjugate().dot(E);
    return { lambda:R.getDiag(), E:E };
};

// 5. Compressed Column Storage matrices
numeric.ccsSparse = function ccsSparse(A) {
    var m = A.length,n,foo, i,j, counts = [];
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            j = parseInt(j);
            while(j>=counts.length) counts[counts.length] = 0;
            if(foo[j]!==0) counts[j]++;
        }
    }
    var n = counts.length;
    var Ai = Array(n+1);
    Ai[0] = 0;
    for(i=0;i<n;++i) Ai[i+1] = Ai[i] + counts[i];
    var Aj = Array(Ai[n]), Av = Array(Ai[n]);
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            if(foo[j]!==0) {
                counts[j]--;
                Aj[Ai[j]+counts[j]] = i;
                Av[Ai[j]+counts[j]] = foo[j];
            }
        }
    }
    return [Ai,Aj,Av];
}
numeric.ccsFull = function ccsFull(A) {
    var Ai = A[0], Aj = A[1], Av = A[2], s = numeric.ccsDim(A), m = s[0], n = s[1], i,j,j0,j1,k;
    var B = numeric.rep([m,n],0);
    for(i=0;i<n;i++) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j<j1;++j) { B[Aj[j]][i] = Av[j]; }
    }
    return B;
}
numeric.ccsTSolve = function ccsTSolve(A,b,x,bj,xj) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, max = Math.max,n=0;
    if(typeof bj === "undefined") x = numeric.rep([m],0);
    if(typeof bj === "undefined") bj = numeric.linspace(0,x.length-1);
    if(typeof xj === "undefined") xj = [];
    function dfs(j) {
        var k;
        if(x[j] !== 0) return;
        x[j] = 1;
        for(k=Ai[j];k<Ai[j+1];++k) dfs(Aj[k]);
        xj[n] = j;
        ++n;
    }
    var i,j,j0,j1,k,l,l0,l1,a;
    for(i=bj.length-1;i!==-1;--i) { dfs(bj[i]); }
    xj.length = n;
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=bj.length-1;i!==-1;--i) { j = bj[i]; x[j] = b[j]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = max(Ai[j+1],j0);
        for(k=j0;k!==j1;++k) { if(Aj[k] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k!==j1;++k) {
            l = Aj[k];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsDFS = function ccsDFS(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[J];
    k1[0] = k11 = Ai[J+1];
    while(1) {
        if(km >= k11) {
            xj[n] = j[m];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Pinv[Aj[km]];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve = function ccsLPSolve(A,B,x,xj,I,Pinv,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Pinv[Bj[i]],Ai,Aj,x,xj,Pinv); }
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=i0;i!==i1;++i) { j = Pinv[Bj[i]]; x[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Pinv[Aj[k]] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k<j1;++k) {
            l = Pinv[Aj[k]];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsLUP1 = function ccsLUP1(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var x = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,x,xj,i,Pinv,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(x[k]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(x[i])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
            a = x[i]; x[i] = x[e]; x[e] = a;
        }
        a = Li[i];
        e = Ui[i];
        d = x[i];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = x[k];
            xj[j] = 0;
            x[k] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsDFS0 = function ccsDFS0(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS0.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv,P) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[Pinv[J]];
    k1[0] = k11 = Ai[Pinv[J]+1];
    while(1) {
        if(isNaN(km)) throw new Error("Ow!");
        if(km >= k11) {
            xj[n] = Pinv[j[m]];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Aj[km];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                foo = Pinv[foo];
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve0 = function ccsLPSolve0(A,B,y,xj,I,Pinv,P,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Bj[i],Ai,Aj,y,xj,Pinv,P); }
    for(i=xj.length-1;i!==-1;--i) { j = xj[i]; y[P[j]] = 0; }
    for(i=i0;i!==i1;++i) { j = Bj[i]; y[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        l = P[j];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Aj[k] === l) { y[l] /= Av[k]; break; } }
        a = y[l];
        for(k=j0;k<j1;++k) y[Aj[k]] -= a*Av[k];
        y[l] = a;
    }
}
numeric.ccsLUP0 = function ccsLUP0(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var y = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve0, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS0(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,y,xj,i,Pinv,P,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(y[P[k]]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(y[P[i]])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
        }
        a = Li[i];
        e = Ui[i];
        d = y[P[i]];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = y[P[k]];
            xj[j] = 0;
            y[P[k]] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsLUP = numeric.ccsLUP0;

numeric.ccsDim = function ccsDim(A) { return [numeric.sup(A[1])+1,A[0].length-1]; }
numeric.ccsGetBlock = function ccsGetBlock(A,i,j) {
    var s = numeric.ccsDim(A),m=s[0],n=s[1];
    if(typeof i === "undefined") { i = numeric.linspace(0,m-1); }
    else if(typeof i === "number") { i = [i]; }
    if(typeof j === "undefined") { j = numeric.linspace(0,n-1); }
    else if(typeof j === "number") { j = [j]; }
    var p,p0,p1,P = i.length,q,Q = j.length,r,jq,ip;
    var Bi = numeric.rep([n],0), Bj=[], Bv=[], B = [Bi,Bj,Bv];
    var Ai = A[0], Aj = A[1], Av = A[2];
    var x = numeric.rep([m],0),count=0,flags = numeric.rep([m],0);
    for(q=0;q<Q;++q) {
        jq = j[q];
        var q0 = Ai[jq];
        var q1 = Ai[jq+1];
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 1;
            x[r] = Av[p];
        }
        for(p=0;p<P;++p) {
            ip = i[p];
            if(flags[ip]) {
                Bj[count] = p;
                Bv[count] = x[i[p]];
                ++count;
            }
        }
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 0;
        }
        Bi[q+1] = count;
    }
    return B;
}

numeric.ccsDot = function ccsDot(A,B) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var Bi = B[0], Bj = B[1], Bv = B[2];
    var sA = numeric.ccsDim(A), sB = numeric.ccsDim(B);
    var m = sA[0], n = sA[1], o = sB[1];
    var x = numeric.rep([m],0), flags = numeric.rep([m],0), xj = Array(m);
    var Ci = numeric.rep([o],0), Cj = [], Cv = [], C = [Ci,Cj,Cv];
    var i,j,k,j0,j1,i0,i1,l,p,a,b;
    for(k=0;k!==o;++k) {
        j0 = Bi[k];
        j1 = Bi[k+1];
        p = 0;
        for(j=j0;j<j1;++j) {
            a = Bj[j];
            b = Bv[j];
            i0 = Ai[a];
            i1 = Ai[a+1];
            for(i=i0;i<i1;++i) {
                l = Aj[i];
                if(flags[l]===0) {
                    xj[p] = l;
                    flags[l] = 1;
                    p = p+1;
                }
                x[l] = x[l] + Av[i]*b;
            }
        }
        j0 = Ci[k];
        j1 = j0+p;
        Ci[k+1] = j1;
        for(j=p-1;j!==-1;--j) {
            b = j0+j;
            i = xj[j];
            Cj[b] = i;
            Cv[b] = x[i];
            flags[i] = 0;
            x[i] = 0;
        }
        Ci[k+1] = Ci[k]+p;
    }
    return C;
}

numeric.ccsLUPSolve = function ccsLUPSolve(LUP,B) {
    var L = LUP.L, U = LUP.U, P = LUP.P;
    var Bi = B[0];
    var flag = false;
    if(typeof Bi !== "object") { B = [[0,B.length],numeric.linspace(0,B.length-1),B]; Bi = B[0]; flag = true; }
    var Bj = B[1], Bv = B[2];
    var n = L[0].length-1, m = Bi.length-1;
    var x = numeric.rep([n],0), xj = Array(n);
    var b = numeric.rep([n],0), bj = Array(n);
    var Xi = numeric.rep([m+1],0), Xj = [], Xv = [];
    var sol = numeric.ccsTSolve;
    var i,j,j0,j1,k,J,N=0;
    for(i=0;i<m;++i) {
        k = 0;
        j0 = Bi[i];
        j1 = Bi[i+1];
        for(j=j0;j<j1;++j) { 
            J = LUP.Pinv[Bj[j]];
            bj[k] = J;
            b[J] = Bv[j];
            ++k;
        }
        bj.length = k;
        sol(L,b,x,bj,xj);
        for(j=bj.length-1;j!==-1;--j) b[bj[j]] = 0;
        sol(U,x,b,xj,bj);
        if(flag) return b;
        for(j=xj.length-1;j!==-1;--j) x[xj[j]] = 0;
        for(j=bj.length-1;j!==-1;--j) {
            J = bj[j];
            Xj[N] = J;
            Xv[N] = b[J];
            b[J] = 0;
            ++N;
        }
        Xi[i+1] = N;
    }
    return [Xi,Xj,Xv];
}

numeric.ccsbinop = function ccsbinop(body,setup) {
    if(typeof setup === "undefined") setup='';
    return Function('X','Y',
            'var Xi = X[0], Xj = X[1], Xv = X[2];\n'+
            'var Yi = Y[0], Yj = Y[1], Yv = Y[2];\n'+
            'var n = Xi.length-1,m = Math.max(numeric.sup(Xj),numeric.sup(Yj))+1;\n'+
            'var Zi = numeric.rep([n+1],0), Zj = [], Zv = [];\n'+
            'var x = numeric.rep([m],0),y = numeric.rep([m],0);\n'+
            'var xk,yk,zk;\n'+
            'var i,j,j0,j1,k,p=0;\n'+
            setup+
            'for(i=0;i<n;++i) {\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Xj[j];\n'+
            '    x[k] = 1;\n'+
            '    Zj[p] = k;\n'+
            '    ++p;\n'+
            '  }\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Yj[j];\n'+
            '    y[k] = Yv[j];\n'+
            '    if(x[k] === 0) {\n'+
            '      Zj[p] = k;\n'+
            '      ++p;\n'+
            '    }\n'+
            '  }\n'+
            '  Zi[i+1] = p;\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = Xv[j];\n'+
            '  j0 = Zi[i]; j1 = Zi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Zj[j];\n'+
            '    xk = x[k];\n'+
            '    yk = y[k];\n'+
            body+'\n'+
            '    Zv[j] = zk;\n'+
            '  }\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = 0;\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) y[Yj[j]] = 0;\n'+
            '}\n'+
            'return [Zi,Zj,Zv];'
            );
};

(function() {
    var k,A,B,C;
    for(k in numeric.ops2) {
        if(isFinite(eval('1'+numeric.ops2[k]+'0'))) A = '[Y[0],Y[1],numeric.'+k+'(X,Y[2])]';
        else A = 'NaN';
        if(isFinite(eval('0'+numeric.ops2[k]+'1'))) B = '[X[0],X[1],numeric.'+k+'(X[2],Y)]';
        else B = 'NaN';
        if(isFinite(eval('1'+numeric.ops2[k]+'0')) && isFinite(eval('0'+numeric.ops2[k]+'1'))) C = 'numeric.ccs'+k+'MM(X,Y)';
        else C = 'NaN';
        numeric['ccs'+k+'MM'] = numeric.ccsbinop('zk = xk '+numeric.ops2[k]+'yk;');
        numeric['ccs'+k] = Function('X','Y',
                'if(typeof X === "number") return '+A+';\n'+
                'if(typeof Y === "number") return '+B+';\n'+
                'return '+C+';\n'
                );
    }
}());

numeric.ccsScatter = function ccsScatter(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = numeric.sup(Aj)+1,m=Ai.length;
    var Ri = numeric.rep([n],0),Rj=Array(m), Rv = Array(m);
    var counts = numeric.rep([n],0),i;
    for(i=0;i<m;++i) counts[Aj[i]]++;
    for(i=0;i<n;++i) Ri[i+1] = Ri[i] + counts[i];
    var ptr = Ri.slice(0),k,Aii;
    for(i=0;i<m;++i) {
        Aii = Aj[i];
        k = ptr[Aii];
        Rj[k] = Ai[i];
        Rv[k] = Av[i];
        ptr[Aii]=ptr[Aii]+1;
    }
    return [Ri,Rj,Rv];
}

numeric.ccsGather = function ccsGather(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = Ai.length-1,m = Aj.length;
    var Ri = Array(m), Rj = Array(m), Rv = Array(m);
    var i,j,j0,j1,p;
    p=0;
    for(i=0;i<n;++i) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j!==j1;++j) {
            Rj[p] = i;
            Ri[p] = Aj[j];
            Rv[p] = Av[j];
            ++p;
        }
    }
    return [Ri,Rj,Rv];
}

// The following sparse linear algebra routines are deprecated.

numeric.sdim = function dim(A,ret,k) {
    if(typeof ret === "undefined") { ret = []; }
    if(typeof A !== "object") return ret;
    if(typeof k === "undefined") { k=0; }
    if(!(k in ret)) { ret[k] = 0; }
    if(A.length > ret[k]) ret[k] = A.length;
    var i;
    for(i in A) {
        if(A.hasOwnProperty(i)) dim(A[i],ret,k+1);
    }
    return ret;
};

numeric.sclone = function clone(A,k,n) {
    if(typeof k === "undefined") { k=0; }
    if(typeof n === "undefined") { n = numeric.sdim(A).length; }
    var i,ret = Array(A.length);
    if(k === n-1) {
        for(i in A) { if(A.hasOwnProperty(i)) ret[i] = A[i]; }
        return ret;
    }
    for(i in A) {
        if(A.hasOwnProperty(i)) ret[i] = clone(A[i],k+1,n);
    }
    return ret;
}

numeric.sdiag = function diag(d) {
    var n = d.length,i,ret = Array(n),i1,i2,i3;
    for(i=n-1;i>=1;i-=2) {
        i1 = i-1;
        ret[i] = []; ret[i][i] = d[i];
        ret[i1] = []; ret[i1][i1] = d[i1];
    }
    if(i===0) { ret[0] = []; ret[0][0] = d[i]; }
    return ret;
}

numeric.sidentity = function identity(n) { return numeric.sdiag(numeric.rep([n],1)); }

numeric.stranspose = function transpose(A) {
    var ret = [], n = A.length, i,j,Ai;
    for(i in A) {
        if(!(A.hasOwnProperty(i))) continue;
        Ai = A[i];
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(typeof ret[j] !== "object") { ret[j] = []; }
            ret[j][i] = Ai[j];
        }
    }
    return ret;
}

numeric.sLUP = function LUP(A,tol) {
    throw new Error("The function numeric.sLUP had a bug in it and has been removed. Please use the new numeric.ccsLUP function instead.");
};

numeric.sdotMM = function dotMM(A,B) {
    var p = A.length, q = B.length, BT = numeric.stranspose(B), r = BT.length, Ai, BTk;
    var i,j,k,accum;
    var ret = Array(p),reti;
    for(i=p-1;i>=0;i--) {
        reti = [];
        Ai = A[i];
        for(k=r-1;k>=0;k--) {
            accum = 0;
            BTk = BT[k];
            for(j in Ai) {
                if(!(Ai.hasOwnProperty(j))) continue;
                if(j in BTk) { accum += Ai[j]*BTk[j]; }
            }
            if(accum) reti[k] = accum;
        }
        ret[i] = reti;
    }
    return ret;
}

numeric.sdotMV = function dotMV(A,x) {
    var p = A.length, Ai, i,j;
    var ret = Array(p), accum;
    for(i=p-1;i>=0;i--) {
        Ai = A[i];
        accum = 0;
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(x[j]) accum += Ai[j]*x[j];
        }
        if(accum) ret[i] = accum;
    }
    return ret;
}

numeric.sdotVM = function dotMV(x,A) {
    var i,j,Ai,alpha;
    var ret = [], accum;
    for(i in x) {
        if(!x.hasOwnProperty(i)) continue;
        Ai = A[i];
        alpha = x[i];
        for(j in Ai) {
            if(!Ai.hasOwnProperty(j)) continue;
            if(!ret[j]) { ret[j] = 0; }
            ret[j] += alpha*Ai[j];
        }
    }
    return ret;
}

numeric.sdotVV = function dotVV(x,y) {
    var i,ret=0;
    for(i in x) { if(x[i] && y[i]) ret+= x[i]*y[i]; }
    return ret;
}

numeric.sdot = function dot(A,B) {
    var m = numeric.sdim(A).length, n = numeric.sdim(B).length;
    var k = m*1000+n;
    switch(k) {
    case 0: return A*B;
    case 1001: return numeric.sdotVV(A,B);
    case 2001: return numeric.sdotMV(A,B);
    case 1002: return numeric.sdotVM(A,B);
    case 2002: return numeric.sdotMM(A,B);
    default: throw new Error('numeric.sdot not implemented for tensors of order '+m+' and '+n);
    }
}

numeric.sscatter = function scatter(V) {
    var n = V[0].length, Vij, i, j, m = V.length, A = [], Aj;
    for(i=n-1;i>=0;--i) {
        if(!V[m-1][i]) continue;
        Aj = A;
        for(j=0;j<m-2;j++) {
            Vij = V[j][i];
            if(!Aj[Vij]) Aj[Vij] = [];
            Aj = Aj[Vij];
        }
        Aj[V[j][i]] = V[j+1][i];
    }
    return A;
}

numeric.sgather = function gather(A,ret,k) {
    if(typeof ret === "undefined") ret = [];
    if(typeof k === "undefined") k = [];
    var n,i,Ai;
    n = k.length;
    for(i in A) {
        if(A.hasOwnProperty(i)) {
            k[n] = parseInt(i);
            Ai = A[i];
            if(typeof Ai === "number") {
                if(Ai) {
                    if(ret.length === 0) {
                        for(i=n+1;i>=0;--i) ret[i] = [];
                    }
                    for(i=n;i>=0;--i) ret[i].push(k[i]);
                    ret[n+1].push(Ai);
                }
            } else gather(Ai,ret,k);
        }
    }
    if(k.length>n) k.pop();
    return ret;
}

// 6. Coordinate matrices
numeric.cLU = function LU(A) {
    var I = A[0], J = A[1], V = A[2];
    var p = I.length, m=0, i,j,k,a,b,c;
    for(i=0;i<p;i++) if(I[i]>m) m=I[i];
    m++;
    var L = Array(m), U = Array(m), left = numeric.rep([m],Infinity), right = numeric.rep([m],-Infinity);
    var Ui, Uj,alpha;
    for(k=0;k<p;k++) {
        i = I[k];
        j = J[k];
        if(j<left[i]) left[i] = j;
        if(j>right[i]) right[i] = j;
    }
    for(i=0;i<m-1;i++) { if(right[i] > right[i+1]) right[i+1] = right[i]; }
    for(i=m-1;i>=1;i--) { if(left[i]<left[i-1]) left[i-1] = left[i]; }
    var countL = 0, countU = 0;
    for(i=0;i<m;i++) {
        U[i] = numeric.rep([right[i]-left[i]+1],0);
        L[i] = numeric.rep([i-left[i]],0);
        countL += i-left[i]+1;
        countU += right[i]-i+1;
    }
    for(k=0;k<p;k++) { i = I[k]; U[i][J[k]-left[i]] = V[k]; }
    for(i=0;i<m-1;i++) {
        a = i-left[i];
        Ui = U[i];
        for(j=i+1;left[j]<=i && j<m;j++) {
            b = i-left[j];
            c = right[i]-i;
            Uj = U[j];
            alpha = Uj[b]/Ui[a];
            if(alpha) {
                for(k=1;k<=c;k++) { Uj[k+b] -= alpha*Ui[k+a]; }
                L[j][i-left[j]] = alpha;
            }
        }
    }
    var Ui = [], Uj = [], Uv = [], Li = [], Lj = [], Lv = [];
    var p,q,foo;
    p=0; q=0;
    for(i=0;i<m;i++) {
        a = left[i];
        b = right[i];
        foo = U[i];
        for(j=i;j<=b;j++) {
            if(foo[j-a]) {
                Ui[p] = i;
                Uj[p] = j;
                Uv[p] = foo[j-a];
                p++;
            }
        }
        foo = L[i];
        for(j=a;j<i;j++) {
            if(foo[j-a]) {
                Li[q] = i;
                Lj[q] = j;
                Lv[q] = foo[j-a];
                q++;
            }
        }
        Li[q] = i;
        Lj[q] = i;
        Lv[q] = 1;
        q++;
    }
    return {U:[Ui,Uj,Uv], L:[Li,Lj,Lv]};
};

numeric.cLUsolve = function LUsolve(lu,b) {
    var L = lu.L, U = lu.U, ret = numeric.clone(b);
    var Li = L[0], Lj = L[1], Lv = L[2];
    var Ui = U[0], Uj = U[1], Uv = U[2];
    var p = Ui.length, q = Li.length;
    var m = ret.length,i,j,k;
    k = 0;
    for(i=0;i<m;i++) {
        while(Lj[k] < i) {
            ret[i] -= Lv[k]*ret[Lj[k]];
            k++;
        }
        k++;
    }
    k = p-1;
    for(i=m-1;i>=0;i--) {
        while(Uj[k] > i) {
            ret[i] -= Uv[k]*ret[Uj[k]];
            k--;
        }
        ret[i] /= Uv[k];
        k--;
    }
    return ret;
};

numeric.cgrid = function grid(n,shape) {
    if(typeof n === "number") n = [n,n];
    var ret = numeric.rep(n,-1);
    var i,j,count;
    if(typeof shape !== "function") {
        switch(shape) {
        case 'L':
            shape = function(i,j) { return (i>=n[0]/2 || j<n[1]/2); }
            break;
        default:
            shape = function(i,j) { return true; };
            break;
        }
    }
    count=0;
    for(i=1;i<n[0]-1;i++) for(j=1;j<n[1]-1;j++) 
        if(shape(i,j)) {
            ret[i][j] = count;
            count++;
        }
    return ret;
}

numeric.cdelsq = function delsq(g) {
    var dir = [[-1,0],[0,-1],[0,1],[1,0]];
    var s = numeric.dim(g), m = s[0], n = s[1], i,j,k,p,q;
    var Li = [], Lj = [], Lv = [];
    for(i=1;i<m-1;i++) for(j=1;j<n-1;j++) {
        if(g[i][j]<0) continue;
        for(k=0;k<4;k++) {
            p = i+dir[k][0];
            q = j+dir[k][1];
            if(g[p][q]<0) continue;
            Li.push(g[i][j]);
            Lj.push(g[p][q]);
            Lv.push(-1);
        }
        Li.push(g[i][j]);
        Lj.push(g[i][j]);
        Lv.push(4);
    }
    return [Li,Lj,Lv];
}

numeric.cdotMV = function dotMV(A,x) {
    var ret, Ai = A[0], Aj = A[1], Av = A[2],k,p=Ai.length,N;
    N=0;
    for(k=0;k<p;k++) { if(Ai[k]>N) N = Ai[k]; }
    N++;
    ret = numeric.rep([N],0);
    for(k=0;k<p;k++) { ret[Ai[k]]+=Av[k]*x[Aj[k]]; }
    return ret;
}

// 7. Splines

numeric.Spline = function Spline(x,yl,yr,kl,kr) { this.x = x; this.yl = yl; this.yr = yr; this.kl = kl; this.kr = kr; }
numeric.Spline.prototype._at = function _at(x1,p) {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var x1,a,b,t;
    var add = numeric.add, sub = numeric.sub, mul = numeric.mul;
    a = sub(mul(kl[p],x[p+1]-x[p]),sub(yr[p+1],yl[p]));
    b = add(mul(kr[p+1],x[p]-x[p+1]),sub(yr[p+1],yl[p]));
    t = (x1-x[p])/(x[p+1]-x[p]);
    var s = t*(1-t);
    return add(add(add(mul(1-t,yl[p]),mul(t,yr[p+1])),mul(a,s*(1-t))),mul(b,s*t));
}
numeric.Spline.prototype.at = function at(x0) {
    if(typeof x0 === "number") {
        var x = this.x;
        var n = x.length;
        var p,q,mid,floor = Math.floor,a,b,t;
        p = 0;
        q = n-1;
        while(q-p>1) {
            mid = floor((p+q)/2);
            if(x[mid] <= x0) p = mid;
            else q = mid;
        }
        return this._at(x0,p);
    }
    var n = x0.length, i, ret = Array(n);
    for(i=n-1;i!==-1;--i) ret[i] = this.at(x0[i]);
    return ret;
}
numeric.Spline.prototype.diff = function diff() {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var n = yl.length;
    var i,dx,dy;
    var zl = kl, zr = kr, pl = Array(n), pr = Array(n);
    var add = numeric.add, mul = numeric.mul, div = numeric.div, sub = numeric.sub;
    for(i=n-1;i!==-1;--i) {
        dx = x[i+1]-x[i];
        dy = sub(yr[i+1],yl[i]);
        pl[i] = div(add(mul(dy, 6),mul(kl[i],-4*dx),mul(kr[i+1],-2*dx)),dx*dx);
        pr[i+1] = div(add(mul(dy,-6),mul(kl[i], 2*dx),mul(kr[i+1], 4*dx)),dx*dx);
    }
    return new numeric.Spline(x,zl,zr,pl,pr);
}
numeric.Spline.prototype.roots = function roots() {
    function sqr(x) { return x*x; }
    function heval(y0,y1,k0,k1,x) {
        var A = k0*2-(y1-y0);
        var B = -k1*2+(y1-y0);
        var t = (x+1)*0.5;
        var s = t*(1-t);
        return (1-t)*y0+t*y1+A*s*(1-t)+B*s*t;
    }
    var ret = [];
    var x = this.x, yl = this.yl, yr = this.yr, kl = this.kl, kr = this.kr;
    if(typeof yl[0] === "number") {
        yl = [yl];
        yr = [yr];
        kl = [kl];
        kr = [kr];
    }
    var m = yl.length,n=x.length-1,i,j,k,y,s,t;
    var ai,bi,ci,di, ret = Array(m),ri,k0,k1,y0,y1,A,B,D,dx,cx,stops,z0,z1,zm,t0,t1,tm;
    var sqrt = Math.sqrt;
    for(i=0;i!==m;++i) {
        ai = yl[i];
        bi = yr[i];
        ci = kl[i];
        di = kr[i];
        ri = [];
        for(j=0;j!==n;j++) {
            if(j>0 && bi[j]*ai[j]<0) ri.push(x[j]);
            dx = (x[j+1]-x[j]);
            cx = x[j];
            y0 = ai[j];
            y1 = bi[j+1];
            k0 = ci[j]/dx;
            k1 = di[j+1]/dx;
            D = sqr(k0-k1+3*(y0-y1)) + 12*k1*y0;
            A = k1+3*y0+2*k0-3*y1;
            B = 3*(k1+k0+2*(y0-y1));
            if(D<=0) {
                z0 = A/B;
                if(z0>x[j] && z0<x[j+1]) stops = [x[j],z0,x[j+1]];
                else stops = [x[j],x[j+1]];
            } else {
                z0 = (A-sqrt(D))/B;
                z1 = (A+sqrt(D))/B;
                stops = [x[j]];
                if(z0>x[j] && z0<x[j+1]) stops.push(z0);
                if(z1>x[j] && z1<x[j+1]) stops.push(z1);
                stops.push(x[j+1]);
            }
            t0 = stops[0];
            z0 = this._at(t0,j);
            for(k=0;k<stops.length-1;k++) {
                t1 = stops[k+1];
                z1 = this._at(t1,j);
                if(z0 === 0) {
                    ri.push(t0); 
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                if(z1 === 0 || z0*z1>0) {
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                var side = 0;
                while(1) {
                    tm = (z0*t1-z1*t0)/(z0-z1);
                    if(tm <= t0 || tm >= t1) { break; }
                    zm = this._at(tm,j);
                    if(zm*z1>0) {
                        t1 = tm;
                        z1 = zm;
                        if(side === -1) z0*=0.5;
                        side = -1;
                    } else if(zm*z0>0) {
                        t0 = tm;
                        z0 = zm;
                        if(side === 1) z1*=0.5;
                        side = 1;
                    } else break;
                }
                ri.push(tm);
                t0 = stops[k+1];
                z0 = this._at(t0, j);
            }
            if(z1 === 0) ri.push(t1);
        }
        ret[i] = ri;
    }
    if(typeof this.yl[0] === "number") return ret[0];
    return ret;
}
numeric.spline = function spline(x,y,k1,kn) {
    var n = x.length, b = [], dx = [], dy = [];
    var i;
    var sub = numeric.sub,mul = numeric.mul,add = numeric.add;
    for(i=n-2;i>=0;i--) { dx[i] = x[i+1]-x[i]; dy[i] = sub(y[i+1],y[i]); }
    if(typeof k1 === "string" || typeof kn === "string") { 
        k1 = kn = "periodic";
    }
    // Build sparse tridiagonal system
    var T = [[],[],[]];
    switch(typeof k1) {
    case "undefined":
        b[0] = mul(3/(dx[0]*dx[0]),dy[0]);
        T[0].push(0,0);
        T[1].push(0,1);
        T[2].push(2/dx[0],1/dx[0]);
        break;
    case "string":
        b[0] = add(mul(3/(dx[n-2]*dx[n-2]),dy[n-2]),mul(3/(dx[0]*dx[0]),dy[0]));
        T[0].push(0,0,0);
        T[1].push(n-2,0,1);
        T[2].push(1/dx[n-2],2/dx[n-2]+2/dx[0],1/dx[0]);
        break;
    default:
        b[0] = k1;
        T[0].push(0);
        T[1].push(0);
        T[2].push(1);
        break;
    }
    for(i=1;i<n-1;i++) {
        b[i] = add(mul(3/(dx[i-1]*dx[i-1]),dy[i-1]),mul(3/(dx[i]*dx[i]),dy[i]));
        T[0].push(i,i,i);
        T[1].push(i-1,i,i+1);
        T[2].push(1/dx[i-1],2/dx[i-1]+2/dx[i],1/dx[i]);
    }
    switch(typeof kn) {
    case "undefined":
        b[n-1] = mul(3/(dx[n-2]*dx[n-2]),dy[n-2]);
        T[0].push(n-1,n-1);
        T[1].push(n-2,n-1);
        T[2].push(1/dx[n-2],2/dx[n-2]);
        break;
    case "string":
        T[1][T[1].length-1] = 0;
        break;
    default:
        b[n-1] = kn;
        T[0].push(n-1);
        T[1].push(n-1);
        T[2].push(1);
        break;
    }
    if(typeof b[0] !== "number") b = numeric.transpose(b);
    else b = [b];
    var k = Array(b.length);
    if(typeof k1 === "string") {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.ccsLUPSolve(numeric.ccsLUP(numeric.ccsScatter(T)),b[i]);
            k[i][n-1] = k[i][0];
        }
    } else {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.cLUsolve(numeric.cLU(T),b[i]);
        }
    }
    if(typeof y[0] === "number") k = k[0];
    else k = numeric.transpose(k);
    return new numeric.Spline(x,y,y,k,k);
}

// 8. FFT
numeric.fftpow2 = function fftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    fftpow2(xe,ye);
    fftpow2(xo,yo);
    j = n/2;
    var t,k = (-6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric._ifftpow2 = function _ifftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    _ifftpow2(xe,ye);
    _ifftpow2(xo,yo);
    j = n/2;
    var t,k = (6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric.ifftpow2 = function ifftpow2(x,y) {
    numeric._ifftpow2(x,y);
    numeric.diveq(x,x.length);
    numeric.diveq(y,y.length);
}
numeric.convpow2 = function convpow2(ax,ay,bx,by) {
    numeric.fftpow2(ax,ay);
    numeric.fftpow2(bx,by);
    var i,n = ax.length,axi,bxi,ayi,byi;
    for(i=n-1;i!==-1;--i) {
        axi = ax[i]; ayi = ay[i]; bxi = bx[i]; byi = by[i];
        ax[i] = axi*bxi-ayi*byi;
        ay[i] = axi*byi+ayi*bxi;
    }
    numeric.ifftpow2(ax,ay);
}
numeric.T.prototype.fft = function fft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (-3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X;
}
numeric.T.prototype.ifft = function ifft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X.div(n);
}

//9. Unconstrained optimization
numeric.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) throw new Error('gradient: f(x) is a NaN!');
    var max = Math.max;
    var i,x0 = numeric.clone(x),f1,f2, J = Array(n);
    var div = numeric.div, sub = numeric.sub,errest,roundoff,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N;
    for(i=0;i<n;i++) {
        var h = max(1e-6*f0,1e-8);
        while(1) {
            ++it;
            if(it>20) { throw new Error("Numerical gradient fails"); }
            x0[i] = x[i]+h;
            f1 = f(x0);
            x0[i] = x[i]-h;
            f2 = f(x0);
            x0[i] = x[i];
            if(isNaN(f1) || isNaN(f2)) { h/=16; continue; }
            J[i] = (f1-f2)/(2*h);
            t0 = x[i]-h;
            t1 = x[i];
            t2 = x[i]+h;
            d1 = (f1-f0)/h;
            d2 = (f0-f2)/h;
            N = max(abs(J[i]),abs(f0),abs(f1),abs(f2),abs(t0),abs(t1),abs(t2),1e-8);
            errest = min(max(abs(d1-J[i]),abs(d2-J[i]),abs(d1-d2))/N,h/N);
            if(errest>eps) { h/=16; }
            else break;
            }
    }
    return J;
}

numeric.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = numeric.gradient;
    if(typeof options === "undefined") { options = {}; }
    if(typeof tol === "undefined") { tol = 1e-8; }
    if(typeof gradient === "undefined") { gradient = function(x) { return grad(f,x); }; }
    if(typeof maxit === "undefined") maxit = 1000;
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot, inv = numeric.inv, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,i,s,x1,y,Hy,Hs,ys,i0,t,nstep,t1,t2;
    var msg = "";
    g0 = gradient(x0);
    while(it<maxit) {
        if(typeof callback === "function") { if(callback(it,x0,f0,g0,H1)) { msg = "Callback returned true"; break; } }
        if(!all(isfinite(g0))) { msg = "Gradient has Infinity or NaN"; break; }
        step = neg(dot(H1,g0));
        if(!all(isfinite(step))) { msg = "Search direction has Infinity or NaN"; break; }
        nstep = norm2(step);
        if(nstep < tol) { msg="Newton step smaller than tol"; break; }
        t = 1;
        df0 = dot(g0,step);
        // line search
        x1 = x0;
        while(it < maxit) {
            if(t*nstep < tol) { break; }
            s = mul(step,t);
            x1 = add(x0,s);
            f1 = f(x1);
            if(f1-f0 >= 0.1*t*df0 || isNaN(f1)) {
                t *= 0.5;
                ++it;
                continue;
            }
            break;
        }
        if(t*nstep < tol) { msg = "Line search step size smaller than tol"; break; }
        if(it === maxit) { msg = "maxit reached during line search"; break; }
        g1 = gradient(x1);
        y = sub(g1,g0);
        ys = dot(y,s);
        Hy = dot(H1,y);
        H1 = sub(add(H1,
                mul(
                        (ys+dot(y,Hy))/(ys*ys),
                        ten(s,s)    )),
                div(add(ten(Hy,s),ten(s,Hy)),ys));
        x0 = x1;
        f0 = f1;
        g0 = g1;
        ++it;
    }
    return {solution: x0, f: f0, gradient: g0, invHessian: H1, iterations:it, message: msg};
}

// 10. Ode solver (Dormand-Prince)
numeric.Dopri = function Dopri(x,y,f,ymid,iterations,msg,events) {
    this.x = x;
    this.y = y;
    this.f = f;
    this.ymid = ymid;
    this.iterations = iterations;
    this.events = events;
    this.message = msg;
}
numeric.Dopri.prototype._at = function _at(xi,j) {
    function sqr(x) { return x*x; }
    var sol = this;
    var xs = sol.x;
    var ys = sol.y;
    var k1 = sol.f;
    var ymid = sol.ymid;
    var n = xs.length;
    var x0,x1,xh,y0,y1,yh,xi;
    var floor = Math.floor,h;
    var c = 0.5;
    var add = numeric.add, mul = numeric.mul,sub = numeric.sub, p,q,w;
    x0 = xs[j];
    x1 = xs[j+1];
    y0 = ys[j];
    y1 = ys[j+1];
    h  = x1-x0;
    xh = x0+c*h;
    yh = ymid[j];
    p = sub(k1[j  ],mul(y0,1/(x0-xh)+2/(x0-x1)));
    q = sub(k1[j+1],mul(y1,1/(x1-xh)+2/(x1-x0)));
    w = [sqr(xi - x1) * (xi - xh) / sqr(x0 - x1) / (x0 - xh),
         sqr(xi - x0) * sqr(xi - x1) / sqr(x0 - xh) / sqr(x1 - xh),
         sqr(xi - x0) * (xi - xh) / sqr(x1 - x0) / (x1 - xh),
         (xi - x0) * sqr(xi - x1) * (xi - xh) / sqr(x0-x1) / (x0 - xh),
         (xi - x1) * sqr(xi - x0) * (xi - xh) / sqr(x0-x1) / (x1 - xh)];
    return add(add(add(add(mul(y0,w[0]),
                           mul(yh,w[1])),
                           mul(y1,w[2])),
                           mul( p,w[3])),
                           mul( q,w[4]));
}
numeric.Dopri.prototype.at = function at(x) {
    var i,j,k,floor = Math.floor;
    if(typeof x !== "number") {
        var n = x.length, ret = Array(n);
        for(i=n-1;i!==-1;--i) {
            ret[i] = this.at(x[i]);
        }
        return ret;
    }
    var x0 = this.x;
    i = 0; j = x0.length-1;
    while(j-i>1) {
        k = floor(0.5*(i+j));
        if(x0[k] <= x) i = k;
        else j = k;
    }
    return this._at(x,i);
}

numeric.dopri = function dopri(x0,x1,y0,f,tol,maxit,event) {
    if(typeof tol === "undefined") { tol = 1e-6; }
    if(typeof maxit === "undefined") { maxit = 1000; }
    var xs = [x0], ys = [y0], k1 = [f(x0,y0)], k2,k3,k4,k5,k6,k7, ymid = [];
    var A2 = 1/5;
    var A3 = [3/40,9/40];
    var A4 = [44/45,-56/15,32/9];
    var A5 = [19372/6561,-25360/2187,64448/6561,-212/729];
    var A6 = [9017/3168,-355/33,46732/5247,49/176,-5103/18656];
    var b = [35/384,0,500/1113,125/192,-2187/6784,11/84];
    var bm = [0.5*6025192743/30085553152,
              0,
              0.5*51252292925/65400821598,
              0.5*-2691868925/45128329728,
              0.5*187940372067/1594534317056,
              0.5*-1776094331/19743644256,
              0.5*11237099/235043384];
    var c = [1/5,3/10,4/5,8/9,1,1];
    var e = [-71/57600,0,71/16695,-71/1920,17253/339200,-22/525,1/40];
    var i = 0,er,j;
    var h = (x1-x0)/10;
    var it = 0;
    var add = numeric.add, mul = numeric.mul, y1,erinf;
    var max = Math.max, min = Math.min, abs = Math.abs, norminf = numeric.norminf,pow = Math.pow;
    var any = numeric.any, lt = numeric.lt, and = numeric.and, sub = numeric.sub;
    var e0, e1, ev;
    var ret = new numeric.Dopri(xs,ys,k1,ymid,-1,"");
    if(typeof event === "function") e0 = event(x0,y0);
    while(x0<x1 && it<maxit) {
        ++it;
        if(x0+h>x1) h = x1-x0;
        k2 = f(x0+c[0]*h,                add(y0,mul(   A2*h,k1[i])));
        k3 = f(x0+c[1]*h,            add(add(y0,mul(A3[0]*h,k1[i])),mul(A3[1]*h,k2)));
        k4 = f(x0+c[2]*h,        add(add(add(y0,mul(A4[0]*h,k1[i])),mul(A4[1]*h,k2)),mul(A4[2]*h,k3)));
        k5 = f(x0+c[3]*h,    add(add(add(add(y0,mul(A5[0]*h,k1[i])),mul(A5[1]*h,k2)),mul(A5[2]*h,k3)),mul(A5[3]*h,k4)));
        k6 = f(x0+c[4]*h,add(add(add(add(add(y0,mul(A6[0]*h,k1[i])),mul(A6[1]*h,k2)),mul(A6[2]*h,k3)),mul(A6[3]*h,k4)),mul(A6[4]*h,k5)));
        y1 = add(add(add(add(add(y0,mul(k1[i],h*b[0])),mul(k3,h*b[2])),mul(k4,h*b[3])),mul(k5,h*b[4])),mul(k6,h*b[5]));
        k7 = f(x0+h,y1);
        er = add(add(add(add(add(mul(k1[i],h*e[0]),mul(k3,h*e[2])),mul(k4,h*e[3])),mul(k5,h*e[4])),mul(k6,h*e[5])),mul(k7,h*e[6]));
        if(typeof er === "number") erinf = abs(er);
        else erinf = norminf(er);
        if(erinf > tol) { // reject
            h = 0.2*h*pow(tol/erinf,0.25);
            if(x0+h === x0) {
                ret.msg = "Step size became too small";
                break;
            }
            continue;
        }
        ymid[i] = add(add(add(add(add(add(y0,
                mul(k1[i],h*bm[0])),
                mul(k3   ,h*bm[2])),
                mul(k4   ,h*bm[3])),
                mul(k5   ,h*bm[4])),
                mul(k6   ,h*bm[5])),
                mul(k7   ,h*bm[6]));
        ++i;
        xs[i] = x0+h;
        ys[i] = y1;
        k1[i] = k7;
        if(typeof event === "function") {
            var yi,xl = x0,xr = x0+0.5*h,xi;
            e1 = event(xr,ymid[i-1]);
            ev = and(lt(e0,0),lt(0,e1));
            if(!any(ev)) { xl = xr; xr = x0+h; e0 = e1; e1 = event(xr,y1); ev = and(lt(e0,0),lt(0,e1)); }
            if(any(ev)) {
                var xc, yc, en,ei;
                var side=0, sl = 1.0, sr = 1.0;
                while(1) {
                    if(typeof e0 === "number") xi = (sr*e1*xl-sl*e0*xr)/(sr*e1-sl*e0);
                    else {
                        xi = xr;
                        for(j=e0.length-1;j!==-1;--j) {
                            if(e0[j]<0 && e1[j]>0) xi = min(xi,(sr*e1[j]*xl-sl*e0[j]*xr)/(sr*e1[j]-sl*e0[j]));
                        }
                    }
                    if(xi <= xl || xi >= xr) break;
                    yi = ret._at(xi, i-1);
                    ei = event(xi,yi);
                    en = and(lt(e0,0),lt(0,ei));
                    if(any(en)) {
                        xr = xi;
                        e1 = ei;
                        ev = en;
                        sr = 1.0;
                        if(side === -1) sl *= 0.5;
                        else sl = 1.0;
                        side = -1;
                    } else {
                        xl = xi;
                        e0 = ei;
                        sl = 1.0;
                        if(side === 1) sr *= 0.5;
                        else sr = 1.0;
                        side = 1;
                    }
                }
                y1 = ret._at(0.5*(x0+xi),i-1);
                ret.f[i] = f(xi,yi);
                ret.x[i] = xi;
                ret.y[i] = yi;
                ret.ymid[i-1] = y1;
                ret.events = ev;
                ret.iterations = it;
                return ret;
            }
        }
        x0 += h;
        y0 = y1;
        e0 = e1;
        h = min(0.8*h*pow(tol/erinf,0.25),4*h);
    }
    ret.iterations = it;
    return ret;
}

// 11. Ax = b
numeric.LU = function(A, fast) {
  fast = fast || false;

  var abs = Math.abs;
  var i, j, k, absAjk, Akk, Ak, Pk, Ai;
  var max;
  var n = A.length, n1 = n-1;
  var P = new Array(n);
  if(!fast) A = numeric.clone(A);

  for (k = 0; k < n; ++k) {
    Pk = k;
    Ak = A[k];
    max = abs(Ak[k]);
    for (j = k + 1; j < n; ++j) {
      absAjk = abs(A[j][k]);
      if (max < absAjk) {
        max = absAjk;
        Pk = j;
      }
    }
    P[k] = Pk;

    if (Pk != k) {
      A[k] = A[Pk];
      A[Pk] = Ak;
      Ak = A[k];
    }

    Akk = Ak[k];

    for (i = k + 1; i < n; ++i) {
      A[i][k] /= Akk;
    }

    for (i = k + 1; i < n; ++i) {
      Ai = A[i];
      for (j = k + 1; j < n1; ++j) {
        Ai[j] -= Ai[k] * Ak[j];
        ++j;
        Ai[j] -= Ai[k] * Ak[j];
      }
      if(j===n1) Ai[j] -= Ai[k] * Ak[j];
    }
  }

  return {
    LU: A,
    P:  P
  };
}

numeric.LUsolve = function LUsolve(LUP, b) {
  var i, j;
  var LU = LUP.LU;
  var n   = LU.length;
  var x = numeric.clone(b);
  var P   = LUP.P;
  var Pi, LUi, LUii, tmp;

  for (i=n-1;i!==-1;--i) x[i] = b[i];
  for (i = 0; i < n; ++i) {
    Pi = P[i];
    if (P[i] !== i) {
      tmp = x[i];
      x[i] = x[Pi];
      x[Pi] = tmp;
    }

    LUi = LU[i];
    for (j = 0; j < i; ++j) {
      x[i] -= x[j] * LUi[j];
    }
  }

  for (i = n - 1; i >= 0; --i) {
    LUi = LU[i];
    for (j = i + 1; j < n; ++j) {
      x[i] -= x[j] * LUi[j];
    }

    x[i] /= LUi[i];
  }

  return x;
}

numeric.solve = function solve(A,b,fast) { return numeric.LUsolve(numeric.LU(A,fast), b); }

// 12. Linear programming
numeric.echelonize = function echelonize(A) {
    var s = numeric.dim(A), m = s[0], n = s[1];
    var I = numeric.identity(m);
    var P = Array(m);
    var i,j,k,l,Ai,Ii,Z,a;
    var abs = Math.abs;
    var diveq = numeric.diveq;
    A = numeric.clone(A);
    for(i=0;i<m;++i) {
        k = 0;
        Ai = A[i];
        Ii = I[i];
        for(j=1;j<n;++j) if(abs(Ai[k])<abs(Ai[j])) k=j;
        P[i] = k;
        diveq(Ii,Ai[k]);
        diveq(Ai,Ai[k]);
        for(j=0;j<m;++j) if(j!==i) {
            Z = A[j]; a = Z[k];
            for(l=n-1;l!==-1;--l) Z[l] -= Ai[l]*a;
            Z = I[j];
            for(l=m-1;l!==-1;--l) Z[l] -= Ii[l]*a;
        }
    }
    return {I:I, A:A, P:P};
}

numeric.__solveLP = function __solveLP(c,A,b,tol,maxit,x,flag) {
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var m = c.length, n = b.length,y;
    var unbounded = false, cb,i0=0;
    var alpha = 1.0;
    var f0,df0,AT = numeric.transpose(A), svd = numeric.svd,transpose = numeric.transpose,leq = numeric.leq, sqrt = Math.sqrt, abs = Math.abs;
    var muleq = numeric.muleq;
    var norm = numeric.norminf, any = numeric.any,min = Math.min;
    var all = numeric.all, gt = numeric.gt;
    var p = Array(m), A0 = Array(n),e=numeric.rep([n],1), H;
    var solve = numeric.solve, z = sub(b,dot(A,x)),count;
    var dotcc = dot(c,c);
    var g;
    for(count=i0;count<maxit;++count) {
        var i,j,d;
        for(i=n-1;i!==-1;--i) A0[i] = div(A[i],z[i]);
        var A1 = transpose(A0);
        for(i=m-1;i!==-1;--i) p[i] = (/*x[i]+*/sum(A1[i]));
        alpha = 0.25*abs(dotcc/dot(c,p));
        var a1 = 100*sqrt(dotcc/dot(p,p));
        if(!isFinite(alpha) || alpha>a1) alpha = a1;
        g = add(c,mul(alpha,p));
        H = dot(A1,A0);
        for(i=m-1;i!==-1;--i) H[i][i] += 1;
        d = solve(H,div(g,alpha),true);
        var t0 = div(z,dot(A,d));
        var t = 1.0;
        for(i=n-1;i!==-1;--i) if(t0[i]<0) t = min(t,-0.999*t0[i]);
        y = sub(x,mul(d,t));
        z = sub(b,dot(A,y));
        if(!all(gt(z,0))) return { solution: x, message: "", iterations: count };
        x = y;
        if(alpha<tol) return { solution: y, message: "", iterations: count };
        if(flag) {
            var s = dot(c,g), Ag = dot(A,g);
            unbounded = true;
            for(i=n-1;i!==-1;--i) if(s*Ag[i]<0) { unbounded = false; break; }
        } else {
            if(x[m-1]>=0) unbounded = false;
            else unbounded = true;
        }
        if(unbounded) return { solution: y, message: "Unbounded", iterations: count };
    }
    return { solution: x, message: "maximum iteration count exceeded", iterations:count };
}

numeric._solveLP = function _solveLP(c,A,b,tol,maxit) {
    var m = c.length, n = b.length,y;
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var c0 = numeric.rep([m],0).concat([1]);
    var J = numeric.rep([n,1],-1);
    var A0 = numeric.blockMatrix([[A                   ,   J  ]]);
    var b0 = b;
    var y = numeric.rep([m],0).concat(Math.max(0,numeric.sup(numeric.neg(b)))+1);
    var x0 = numeric.__solveLP(c0,A0,b0,tol,maxit,y,false);
    var x = numeric.clone(x0.solution);
    x.length = m;
    var foo = numeric.inf(sub(b,dot(A,x)));
    if(foo<0) { return { solution: NaN, message: "Infeasible", iterations: x0.iterations }; }
    var ret = numeric.__solveLP(c, A, b, tol, maxit-x0.iterations, x, true);
    ret.iterations += x0.iterations;
    return ret;
};

numeric.solveLP = function solveLP(c,A,b,Aeq,beq,tol,maxit) {
    if(typeof maxit === "undefined") maxit = 1000;
    if(typeof tol === "undefined") tol = numeric.epsilon;
    if(typeof Aeq === "undefined") return numeric._solveLP(c,A,b,tol,maxit);
    var m = Aeq.length, n = Aeq[0].length, o = A.length;
    var B = numeric.echelonize(Aeq);
    var flags = numeric.rep([n],0);
    var P = B.P;
    var Q = [];
    var i;
    for(i=P.length-1;i!==-1;--i) flags[P[i]] = 1;
    for(i=n-1;i!==-1;--i) if(flags[i]===0) Q.push(i);
    var g = numeric.getRange;
    var I = numeric.linspace(0,m-1), J = numeric.linspace(0,o-1);
    var Aeq2 = g(Aeq,I,Q), A1 = g(A,J,P), A2 = g(A,J,Q), dot = numeric.dot, sub = numeric.sub;
    var A3 = dot(A1,B.I);
    var A4 = sub(A2,dot(A3,Aeq2)), b4 = sub(b,dot(A3,beq));
    var c1 = Array(P.length), c2 = Array(Q.length);
    for(i=P.length-1;i!==-1;--i) c1[i] = c[P[i]];
    for(i=Q.length-1;i!==-1;--i) c2[i] = c[Q[i]];
    var c4 = sub(c2,dot(c1,dot(B.I,Aeq2)));
    var S = numeric._solveLP(c4,A4,b4,tol,maxit);
    var x2 = S.solution;
    if(x2!==x2) return S;
    var x1 = dot(B.I,sub(beq,dot(Aeq2,x2)));
    var x = Array(c.length);
    for(i=P.length-1;i!==-1;--i) x[P[i]] = x1[i];
    for(i=Q.length-1;i!==-1;--i) x[Q[i]] = x2[i];
    return { solution: x, message:S.message, iterations: S.iterations };
}

numeric.MPStoLP = function MPStoLP(MPS) {
    if(MPS instanceof String) { MPS.split('\n'); }
    var state = 0;
    var states = ['Initial state','NAME','ROWS','COLUMNS','RHS','BOUNDS','ENDATA'];
    var n = MPS.length;
    var i,j,z,N=0,rows = {}, sign = [], rl = 0, vars = {}, nv = 0;
    var name;
    var c = [], A = [], b = [];
    function err(e) { throw new Error('MPStoLP: '+e+'\nLine '+i+': '+MPS[i]+'\nCurrent state: '+states[state]+'\n'); }
    for(i=0;i<n;++i) {
        z = MPS[i];
        var w0 = z.match(/\S*/g);
        var w = [];
        for(j=0;j<w0.length;++j) if(w0[j]!=="") w.push(w0[j]);
        if(w.length === 0) continue;
        for(j=0;j<states.length;++j) if(z.substr(0,states[j].length) === states[j]) break;
        if(j<states.length) {
            state = j;
            if(j===1) { name = w[1]; }
            if(j===6) return { name:name, c:c, A:numeric.transpose(A), b:b, rows:rows, vars:vars };
            continue;
        }
        switch(state) {
        case 0: case 1: err('Unexpected line');
        case 2: 
            switch(w[0]) {
            case 'N': if(N===0) N = w[1]; else err('Two or more N rows'); break;
            case 'L': rows[w[1]] = rl; sign[rl] = 1; b[rl] = 0; ++rl; break;
            case 'G': rows[w[1]] = rl; sign[rl] = -1;b[rl] = 0; ++rl; break;
            case 'E': rows[w[1]] = rl; sign[rl] = 0;b[rl] = 0; ++rl; break;
            default: err('Parse error '+numeric.prettyPrint(w));
            }
            break;
        case 3:
            if(!vars.hasOwnProperty(w[0])) { vars[w[0]] = nv; c[nv] = 0; A[nv] = numeric.rep([rl],0); ++nv; }
            var p = vars[w[0]];
            for(j=1;j<w.length;j+=2) {
                if(w[j] === N) { c[p] = parseFloat(w[j+1]); continue; }
                var q = rows[w[j]];
                A[p][q] = (sign[q]<0?-1:1)*parseFloat(w[j+1]);
            }
            break;
        case 4:
            for(j=1;j<w.length;j+=2) b[rows[w[j]]] = (sign[rows[w[j]]]<0?-1:1)*parseFloat(w[j+1]);
            break;
        case 5: /*FIXME*/ break;
        case 6: err('Internal error');
        }
    }
    err('Reached end of file without ENDATA');
}
// seedrandom.js version 2.0.
// Author: David Bau 4/2/2011
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
//
// Usage:
//
//   <script src=http://davidbau.com/encode/seedrandom-min.js></script>
//
//   Math.seedrandom('yipee'); Sets Math.random to a function that is
//                             initialized using the given explicit seed.
//
//   Math.seedrandom();        Sets Math.random to a function that is
//                             seeded using the current time, dom state,
//                             and other accumulated local entropy.
//                             The generated seed string is returned.
//
//   Math.seedrandom('yowza', true);
//                             Seeds using the given explicit seed mixed
//                             together with accumulated entropy.
//
//   <script src="http://bit.ly/srandom-512"></script>
//                             Seeds using physical random bits downloaded
//                             from random.org.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 Seeds using urandom bits from call.jsonlib.com,
//                             which is faster than random.org.
//
// Examples:
//
//   Math.seedrandom("hello");            // Use "hello" as the seed.
//   document.write(Math.random());       // Always 0.5463663768140734
//   document.write(Math.random());       // Always 0.43973793770592234
//   var rng1 = Math.random;              // Remember the current prng.
//
//   var autoseed = Math.seedrandom();    // New prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable.
//
//   Math.random = rng1;                  // Continue "hello" prng sequence.
//   document.write(Math.random());       // Always 0.554769432473455
//
//   Math.seedrandom(autoseed);           // Restart at the previous seed.
//   document.write(Math.random());       // Repeat the 'unpredictable' value.
//
// Notes:
//
// Each time seedrandom('arg') is called, entropy from the passed seed
// is accumulated in a pool to help generate future seeds for the
// zero-argument form of Math.seedrandom, so entropy can be injected over
// time by calling seedrandom with explicit data repeatedly.
//
// On speed - This javascript implementation of Math.random() is about
// 3-10x slower than the built-in Math.random() because it is not native
// code, but this is typically fast enough anyway.  Seeding is more expensive,
// especially if you use auto-seeding.  Some details (timings on Chrome 4):
//
// Our Math.random()            - avg less than 0.002 milliseconds per call
// seedrandom('explicit')       - avg less than 0.5 milliseconds per call
// seedrandom('explicit', true) - avg less than 2 milliseconds per call
// seedrandom()                 - avg about 38 milliseconds per call
//
// LICENSE (BSD):
//
// Copyright 2010 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
// 
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
/**
 * All code is in an anonymous closure to keep the global namespace clean.
 *
 * @param {number=} overflow 
 * @param {number=} startdenom
 */

// Patched by Seb so that seedrandom.js does not pollute the Math object.
// My tests suggest that doing Math.trouble = 1 makes Math lookups about 5%
// slower.
numeric.seedrandom = { pow:Math.pow, random:Math.random };

(function (pool, math, width, chunks, significance, overflow, startdenom) {


//
// seedrandom()
// This is the seedrandom function described above.
//
math['seedrandom'] = function seedrandom(seed, use_entropy) {
  var key = [];
  var arc4;

  // Flatten the seed string or build one from local entropy if needed.
  seed = mixkey(flatten(
    use_entropy ? [seed, pool] :
    arguments.length ? seed :
    [new Date().getTime(), pool, window], 3), key);

  // Use the seed to initialize an ARC4 generator.
  arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(arc4.S, pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  math['random'] = function random() {  // Closure to return a random double:
    var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
    var d = startdenom;                 //   and denominator d = 2 ^ 48.
    var x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  // Return the seed that was used
  return seed;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, u, me = this, keylen = key.length;
  var i = 0, j = me.i = me.j = me.m = 0;
  me.S = [];
  me.c = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) { me.S[i] = i++; }
  for (i = 0; i < width; i++) {
    t = me.S[i];
    j = lowbits(j + t + key[i % keylen]);
    u = me.S[j];
    me.S[i] = u;
    me.S[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  me.g = function getnext(count) {
    var s = me.S;
    var i = lowbits(me.i + 1); var t = s[i];
    var j = lowbits(me.j + t); var u = s[j];
    s[i] = u;
    s[j] = t;
    var r = s[lowbits(t + u)];
    while (--count) {
      i = lowbits(i + 1); t = s[i];
      j = lowbits(j + t); u = s[j];
      s[i] = u;
      s[j] = t;
      r = r * width + s[lowbits(t + u)];
    }
    me.i = i;
    me.j = j;
    return r;
  };
  // For robust unpredictability discard an initial batch of values.
  // See http://www.rsa.com/rsalabs/node.asp?id=2009
  me.g(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
/** @param {Object=} result 
  * @param {string=} prop
  * @param {string=} typ */
function flatten(obj, depth, result, prop, typ) {
  result = [];
  typ = typeof(obj);
  if (depth && typ == 'object') {
    for (prop in obj) {
      if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
  }
  return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
/** @param {number=} smear 
  * @param {number=} j */
function mixkey(seed, key, smear, j) {
  seed += '';                         // Ensure the seed is a string
  smear = 0;
  for (j = 0; j < seed.length; j++) {
    key[lowbits(j)] =
      lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
  }
  seed = '';
  for (j in key) { seed += String.fromCharCode(key[j]); }
  return seed;
}

//
// lowbits()
// A quick "n mod width" for width a power of 2.
//
function lowbits(n) { return n & (width - 1); }

//
// The following constants are related to IEEE 754 limits.
//
startdenom = math.pow(width, chunks);
significance = math.pow(2, significance);
overflow = significance * 2;

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

// End anonymous scope, and pass initial values.
}(
  [],   // pool: entropy pool starts empty
  numeric.seedrandom, // math: package containing random, pow, and seedrandom
  256,  // width: each RC4 output is 0 <= x < 256
  6,    // chunks: at least six RC4 outputs for each double
  52    // significance: there are 52 significant digits in a double
  ));
/* This file is a slightly modified version of quadprog.js from Alberto Santini.
 * It has been slightly modified by Sébastien Loisel to make sure that it handles
 * 0-based Arrays instead of 1-based Arrays.
 * License is in resources/LICENSE.quadprog */
(function(exports) {

function base0to1(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=0;i<n;i++) ret[i+1] = base0to1(A[i]);
    return ret;
}
function base1to0(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=1;i<n;i++) ret[i-1] = base1to0(A[i]);
    return ret;
}

function dpori(a, lda, n) {
    var i, j, k, kp1, t;

    for (k = 1; k <= n; k = k + 1) {
        a[k][k] = 1 / a[k][k];
        t = -a[k][k];
        //~ dscal(k - 1, t, a[1][k], 1);
        for (i = 1; i < k; i = i + 1) {
            a[i][k] = t * a[i][k];
        }

        kp1 = k + 1;
        if (n < kp1) {
            break;
        }
        for (j = kp1; j <= n; j = j + 1) {
            t = a[k][j];
            a[k][j] = 0;
            //~ daxpy(k, t, a[1][k], 1, a[1][j], 1);
            for (i = 1; i <= k; i = i + 1) {
                a[i][j] = a[i][j] + (t * a[i][k]);
            }
        }
    }

}

function dposl(a, lda, n, b) {
    var i, k, kb, t;

    for (k = 1; k <= n; k = k + 1) {
        //~ t = ddot(k - 1, a[1][k], 1, b[1], 1);
        t = 0;
        for (i = 1; i < k; i = i + 1) {
            t = t + (a[i][k] * b[i]);
        }

        b[k] = (b[k] - t) / a[k][k];
    }

    for (kb = 1; kb <= n; kb = kb + 1) {
        k = n + 1 - kb;
        b[k] = b[k] / a[k][k];
        t = -b[k];
        //~ daxpy(k - 1, t, a[1][k], 1, b[1], 1);
        for (i = 1; i < k; i = i + 1) {
            b[i] = b[i] + (t * a[i][k]);
        }
    }
}

function dpofa(a, lda, n, info) {
    var i, j, jm1, k, t, s;

    for (j = 1; j <= n; j = j + 1) {
        info[1] = j;
        s = 0;
        jm1 = j - 1;
        if (jm1 < 1) {
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        } else {
            for (k = 1; k <= jm1; k = k + 1) {
                //~ t = a[k][j] - ddot(k - 1, a[1][k], 1, a[1][j], 1);
                t = a[k][j];
                for (i = 1; i < k; i = i + 1) {
                    t = t - (a[i][j] * a[i][k]);
                }
                t = t / a[k][k];
                a[k][j] = t;
                s = s + t * t;
            }
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        }
        info[1] = 0;
    }
}

function qpgen2(dmat, dvec, fddmat, n, sol, crval, amat,
    bvec, fdamat, q, meq, iact, nact, iter, work, ierr) {

    var i, j, l, l1, info, it1, iwzv, iwrv, iwrm, iwsv, iwuv, nvl, r, iwnbv,
        temp, sum, t1, tt, gc, gs, nu,
        t1inf, t2min,
        vsmall, tmpa, tmpb,
        go;

    r = Math.min(n, q);
    l = 2 * n + (r * (r + 5)) / 2 + 2 * q + 1;

    vsmall = 1.0e-60;
    do {
        vsmall = vsmall + vsmall;
        tmpa = 1 + 0.1 * vsmall;
        tmpb = 1 + 0.2 * vsmall;
    } while (tmpa <= 1 || tmpb <= 1);

    for (i = 1; i <= n; i = i + 1) {
        work[i] = dvec[i];
    }
    for (i = n + 1; i <= l; i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }

    info = [];

    if (ierr[1] === 0) {
        dpofa(dmat, fddmat, n, info);
        if (info[1] !== 0) {
            ierr[1] = 2;
            return;
        }
        dposl(dmat, fddmat, n, dvec);
        dpori(dmat, fddmat, n);
    } else {
        for (j = 1; j <= n; j = j + 1) {
            sol[j] = 0;
            for (i = 1; i <= j; i = i + 1) {
                sol[j] = sol[j] + dmat[i][j] * dvec[i];
            }
        }
        for (j = 1; j <= n; j = j + 1) {
            dvec[j] = 0;
            for (i = j; i <= n; i = i + 1) {
                dvec[j] = dvec[j] + dmat[j][i] * sol[i];
            }
        }
    }

    crval[1] = 0;
    for (j = 1; j <= n; j = j + 1) {
        sol[j] = dvec[j];
        crval[1] = crval[1] + work[j] * sol[j];
        work[j] = 0;
        for (i = j + 1; i <= n; i = i + 1) {
            dmat[i][j] = 0;
        }
    }
    crval[1] = -crval[1] / 2;
    ierr[1] = 0;

    iwzv = n;
    iwrv = iwzv + n;
    iwuv = iwrv + r;
    iwrm = iwuv + r + 1;
    iwsv = iwrm + (r * (r + 1)) / 2;
    iwnbv = iwsv + q;

    for (i = 1; i <= q; i = i + 1) {
        sum = 0;
        for (j = 1; j <= n; j = j + 1) {
            sum = sum + amat[j][i] * amat[j][i];
        }
        work[iwnbv + i] = Math.sqrt(sum);
    }
    nact = 0;
    iter[1] = 0;
    iter[2] = 0;

    function fn_goto_50() {
        iter[1] = iter[1] + 1;

        l = iwsv;
        for (i = 1; i <= q; i = i + 1) {
            l = l + 1;
            sum = -bvec[i];
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + amat[j][i] * sol[j];
            }
            if (Math.abs(sum) < vsmall) {
                sum = 0;
            }
            if (i > meq) {
                work[l] = sum;
            } else {
                work[l] = -Math.abs(sum);
                if (sum > 0) {
                    for (j = 1; j <= n; j = j + 1) {
                        amat[j][i] = -amat[j][i];
                    }
                    bvec[i] = -bvec[i];
                }
            }
        }

        for (i = 1; i <= nact; i = i + 1) {
            work[iwsv + iact[i]] = 0;
        }

        nvl = 0;
        temp = 0;
        for (i = 1; i <= q; i = i + 1) {
            if (work[iwsv + i] < temp * work[iwnbv + i]) {
                nvl = i;
                temp = work[iwsv + i] / work[iwnbv + i];
            }
        }
        if (nvl === 0) {
            return 999;
        }

        return 0;
    }

    function fn_goto_55() {
        for (i = 1; i <= n; i = i + 1) {
            sum = 0;
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + dmat[j][i] * amat[j][nvl];
            }
            work[i] = sum;
        }

        l1 = iwzv;
        for (i = 1; i <= n; i = i + 1) {
            work[l1 + i] = 0;
        }
        for (j = nact + 1; j <= n; j = j + 1) {
            for (i = 1; i <= n; i = i + 1) {
                work[l1 + i] = work[l1 + i] + dmat[i][j] * work[j];
            }
        }

        t1inf = true;
        for (i = nact; i >= 1; i = i - 1) {
            sum = work[i];
            l = iwrm + (i * (i + 3)) / 2;
            l1 = l - i;
            for (j = i + 1; j <= nact; j = j + 1) {
                sum = sum - work[l] * work[iwrv + j];
                l = l + j;
            }
            sum = sum / work[l1];
            work[iwrv + i] = sum;
            if (iact[i] < meq) {
                // continue;
                break;
            }
            if (sum < 0) {
                // continue;
                break;
            }
            t1inf = false;
            it1 = i;
        }

        if (!t1inf) {
            t1 = work[iwuv + it1] / work[iwrv + it1];
            for (i = 1; i <= nact; i = i + 1) {
                if (iact[i] < meq) {
                    // continue;
                    break;
                }
                if (work[iwrv + i] < 0) {
                    // continue;
                    break;
                }
                temp = work[iwuv + i] / work[iwrv + i];
                if (temp < t1) {
                    t1 = temp;
                    it1 = i;
                }
            }
        }

        sum = 0;
        for (i = iwzv + 1; i <= iwzv + n; i = i + 1) {
            sum = sum + work[i] * work[i];
        }
        if (Math.abs(sum) <= vsmall) {
            if (t1inf) {
                ierr[1] = 1;
                // GOTO 999
                return 999;
            } else {
                for (i = 1; i <= nact; i = i + 1) {
                    work[iwuv + i] = work[iwuv + i] - t1 * work[iwrv + i];
                }
                work[iwuv + nact + 1] = work[iwuv + nact + 1] + t1;
                // GOTO 700
                return 700;
            }
        } else {
            sum = 0;
            for (i = 1; i <= n; i = i + 1) {
                sum = sum + work[iwzv + i] * amat[i][nvl];
            }
            tt = -work[iwsv + nvl] / sum;
            t2min = true;
            if (!t1inf) {
                if (t1 < tt) {
                    tt = t1;
                    t2min = false;
                }
            }

            for (i = 1; i <= n; i = i + 1) {
                sol[i] = sol[i] + tt * work[iwzv + i];
                if (Math.abs(sol[i]) < vsmall) {
                    sol[i] = 0;
                }
            }

            crval[1] = crval[1] + tt * sum * (tt / 2 + work[iwuv + nact + 1]);
            for (i = 1; i <= nact; i = i + 1) {
                work[iwuv + i] = work[iwuv + i] - tt * work[iwrv + i];
            }
            work[iwuv + nact + 1] = work[iwuv + nact + 1] + tt;

            if (t2min) {
                nact = nact + 1;
                iact[nact] = nvl;

                l = iwrm + ((nact - 1) * nact) / 2 + 1;
                for (i = 1; i <= nact - 1; i = i + 1) {
                    work[l] = work[i];
                    l = l + 1;
                }

                if (nact === n) {
                    work[l] = work[n];
                } else {
                    for (i = n; i >= nact + 1; i = i - 1) {
                        if (work[i] === 0) {
                            // continue;
                            break;
                        }
                        gc = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
                        gs = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
                        if (work[i - 1] >= 0) {
                            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        } else {
                            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        }
                        gc = work[i - 1] / temp;
                        gs = work[i] / temp;

                        if (gc === 1) {
                            // continue;
                            break;
                        }
                        if (gc === 0) {
                            work[i - 1] = gs * temp;
                            for (j = 1; j <= n; j = j + 1) {
                                temp = dmat[j][i - 1];
                                dmat[j][i - 1] = dmat[j][i];
                                dmat[j][i] = temp;
                            }
                        } else {
                            work[i - 1] = temp;
                            nu = gs / (1 + gc);
                            for (j = 1; j <= n; j = j + 1) {
                                temp = gc * dmat[j][i - 1] + gs * dmat[j][i];
                                dmat[j][i] = nu * (dmat[j][i - 1] + temp) - dmat[j][i];
                                dmat[j][i - 1] = temp;

                            }
                        }
                    }
                    work[l] = work[nact];
                }
            } else {
                sum = -bvec[nvl];
                for (j = 1; j <= n; j = j + 1) {
                    sum = sum + sol[j] * amat[j][nvl];
                }
                if (nvl > meq) {
                    work[iwsv + nvl] = sum;
                } else {
                    work[iwsv + nvl] = -Math.abs(sum);
                    if (sum > 0) {
                        for (j = 1; j <= n; j = j + 1) {
                            amat[j][nvl] = -amat[j][nvl];
                        }
                        bvec[nvl] = -bvec[nvl];
                    }
                }
                // GOTO 700
                return 700;
            }
        }

        return 0;
    }

    function fn_goto_797() {
        l = iwrm + (it1 * (it1 + 1)) / 2 + 1;
        l1 = l + it1;
        if (work[l1] === 0) {
            // GOTO 798
            return 798;
        }
        gc = Math.max(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        gs = Math.min(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        if (work[l1 - 1] >= 0) {
            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        } else {
            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        }
        gc = work[l1 - 1] / temp;
        gs = work[l1] / temp;

        if (gc === 1) {
            // GOTO 798
            return 798;
        }
        if (gc === 0) {
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = work[l1 - 1];
                work[l1 - 1] = work[l1];
                work[l1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = dmat[i][it1];
                dmat[i][it1] = dmat[i][it1 + 1];
                dmat[i][it1 + 1] = temp;
            }
        } else {
            nu = gs / (1 + gc);
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = gc * work[l1 - 1] + gs * work[l1];
                work[l1] = nu * (work[l1 - 1] + temp) - work[l1];
                work[l1 - 1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = gc * dmat[i][it1] + gs * dmat[i][it1 + 1];
                dmat[i][it1 + 1] = nu * (dmat[i][it1] + temp) - dmat[i][it1 + 1];
                dmat[i][it1] = temp;
            }
        }

        return 0;
    }

    function fn_goto_798() {
        l1 = l - it1;
        for (i = 1; i <= it1; i = i + 1) {
            work[l1] = work[l];
            l = l + 1;
            l1 = l1 + 1;
        }

        work[iwuv + it1] = work[iwuv + it1 + 1];
        iact[it1] = iact[it1 + 1];
        it1 = it1 + 1;
        if (it1 < nact) {
            // GOTO 797
            return 797;
        }

        return 0;
    }

    function fn_goto_799() {
        work[iwuv + nact] = work[iwuv + nact + 1];
        work[iwuv + nact + 1] = 0;
        iact[nact] = 0;
        nact = nact - 1;
        iter[2] = iter[2] + 1;

        return 0;
    }

    go = 0;
    while (true) {
        go = fn_goto_50();
        if (go === 999) {
            return;
        }
        while (true) {
            go = fn_goto_55();
            if (go === 0) {
                break;
            }
            if (go === 999) {
                return;
            }
            if (go === 700) {
                if (it1 === nact) {
                    fn_goto_799();
                } else {
                    while (true) {
                        fn_goto_797();
                        go = fn_goto_798();
                        if (go !== 797) {
                            break;
                        }
                    }
                    fn_goto_799();
                }
            }
        }
    }

}

function solveQP(Dmat, dvec, Amat, bvec, meq, factorized) {
    Dmat = base0to1(Dmat);
    dvec = base0to1(dvec);
    Amat = base0to1(Amat);
    var i, n, q,
        nact, r,
        crval = [], iact = [], sol = [], work = [], iter = [],
        message;

    meq = meq || 0;
    factorized = factorized ? base0to1(factorized) : [undefined, 0];
    bvec = bvec ? base0to1(bvec) : [];

    // In Fortran the array index starts from 1
    n = Dmat.length - 1;
    q = Amat[1].length - 1;

    if (!bvec) {
        for (i = 1; i <= q; i = i + 1) {
            bvec[i] = 0;
        }
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }
    nact = 0;
    r = Math.min(n, q);
    for (i = 1; i <= n; i = i + 1) {
        sol[i] = 0;
    }
    crval[1] = 0;
    for (i = 1; i <= (2 * n + (r * (r + 5)) / 2 + 2 * q + 1); i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= 2; i = i + 1) {
        iter[i] = 0;
    }

    qpgen2(Dmat, dvec, n, n, sol, crval, Amat,
        bvec, n, q, meq, iact, nact, iter, work, factorized);

    message = "";
    if (factorized[1] === 1) {
        message = "constraints are inconsistent, no solution!";
    }
    if (factorized[1] === 2) {
        message = "matrix D in quadratic function is not positive definite!";
    }

    return {
        solution: base1to0(sol),
        value: base1to0(crval),
        unconstrained_solution: base1to0(dvec),
        iterations: base1to0(iter),
        iact: base1to0(iact),
        message: message
    };
}
exports.solveQP = solveQP;
}(numeric));
/*
Shanti Rao sent me this routine by private email. I had to modify it
slightly to work on Arrays instead of using a Matrix object.
It is apparently translated from http://stitchpanorama.sourceforge.net/Python/svd.py
*/

numeric.svd= function svd(A) {
    var temp;
//Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
	var prec= numeric.epsilon; //Math.pow(2,-52) // assumes double prec
	var tolerance= 1.e-64/prec;
	var itmax= 50;
	var c=0;
	var i=0;
	var j=0;
	var k=0;
	var l=0;
	
	var u= numeric.clone(A);
	var m= u.length;
	
	var n= u[0].length;
	
	if (m < n) throw "Need more rows than columns"
	
	var e = new Array(n);
	var q = new Array(n);
	for (i=0; i<n; i++) e[i] = q[i] = 0.0;
	var v = numeric.rep([n,n],0);
//	v.zero();
	
 	function pythag(a,b)
 	{
		a = Math.abs(a)
		b = Math.abs(b)
		if (a > b)
			return a*Math.sqrt(1.0+(b*b/a/a))
		else if (b == 0.0) 
			return a
		return b*Math.sqrt(1.0+(a*a/b/b))
	}

	//Householder's reduction to bidiagonal form

	var f= 0.0;
	var g= 0.0;
	var h= 0.0;
	var x= 0.0;
	var y= 0.0;
	var z= 0.0;
	var s= 0.0;
	
	for (i=0; i < n; i++)
	{	
		e[i]= g;
		s= 0.0;
		l= i+1;
		for (j=i; j < m; j++) 
			s += (u[j][i]*u[j][i]);
		if (s <= tolerance)
			g= 0.0;
		else
		{	
			f= u[i][i];
			g= Math.sqrt(s);
			if (f >= 0.0) g= -g;
			h= f*g-s
			u[i][i]=f-g;
			for (j=l; j < n; j++)
			{
				s= 0.0
				for (k=i; k < m; k++) 
					s += u[k][i]*u[k][j]
				f= s/h
				for (k=i; k < m; k++) 
					u[k][j]+=f*u[k][i]
			}
		}
		q[i]= g
		s= 0.0
		for (j=l; j < n; j++) 
			s= s + u[i][j]*u[i][j]
		if (s <= tolerance)
			g= 0.0
		else
		{	
			f= u[i][i+1]
			g= Math.sqrt(s)
			if (f >= 0.0) g= -g
			h= f*g - s
			u[i][i+1] = f-g;
			for (j=l; j < n; j++) e[j]= u[i][j]/h
			for (j=l; j < m; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += (u[j][k]*u[i][k])
				for (k=l; k < n; k++) 
					u[j][k]+=s*e[k]
			}	
		}
		y= Math.abs(q[i])+Math.abs(e[i])
		if (y>x) 
			x=y
	}
	
	// accumulation of right hand gtransformations
	for (i=n-1; i != -1; i+= -1)
	{	
		if (g != 0.0)
		{
		 	h= g*u[i][i+1]
			for (j=l; j < n; j++) 
				v[j][i]=u[i][j]/h
			for (j=l; j < n; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += u[i][k]*v[k][j]
				for (k=l; k < n; k++) 
					v[k][j]+=(s*v[k][i])
			}	
		}
		for (j=l; j < n; j++)
		{
			v[i][j] = 0;
			v[j][i] = 0;
		}
		v[i][i] = 1;
		g= e[i]
		l= i
	}
	
	// accumulation of left hand transformations
	for (i=n-1; i != -1; i+= -1)
	{	
		l= i+1
		g= q[i]
		for (j=l; j < n; j++) 
			u[i][j] = 0;
		if (g != 0.0)
		{
			h= u[i][i]*g
			for (j=l; j < n; j++)
			{
				s=0.0
				for (k=l; k < m; k++) s += u[k][i]*u[k][j];
				f= s/h
				for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
			}
			for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
		}
		else
			for (j=i; j < m; j++) u[j][i] = 0;
		u[i][i] += 1;
	}
	
	// diagonalization of the bidiagonal form
	prec= prec*x
	for (k=n-1; k != -1; k+= -1)
	{
		for (var iteration=0; iteration < itmax; iteration++)
		{	// test f splitting
			var test_convergence = false
			for (l=k; l != -1; l+= -1)
			{	
				if (Math.abs(e[l]) <= prec)
				{	test_convergence= true
					break 
				}
				if (Math.abs(q[l-1]) <= prec)
					break 
			}
			if (!test_convergence)
			{	// cancellation of e[l] if l>0
				c= 0.0
				s= 1.0
				var l1= l-1
				for (i =l; i<k+1; i++)
				{	
					f= s*e[i]
					e[i]= c*e[i]
					if (Math.abs(f) <= prec)
						break
					g= q[i]
					h= pythag(f,g)
					q[i]= h
					c= g/h
					s= -f/h
					for (j=0; j < m; j++)
					{	
						y= u[j][l1]
						z= u[j][i]
						u[j][l1] =  y*c+(z*s)
						u[j][i] = -y*s+(z*c)
					} 
				}	
			}
			// test f convergence
			z= q[k]
			if (l== k)
			{	//convergence
				if (z<0.0)
				{	//q[k] is made non-negative
					q[k]= -z
					for (j=0; j < n; j++)
						v[j][k] = -v[j][k]
				}
				break  //break out of iteration loop and move on to next k value
			}
			if (iteration >= itmax-1)
				throw 'Error: no convergence.'
			// shift from bottom 2x2 minor
			x= q[l]
			y= q[k-1]
			g= e[k-1]
			h= e[k]
			f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
			g= pythag(f,1.0)
			if (f < 0.0)
				f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
			else
				f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
			// next QR transformation
			c= 1.0
			s= 1.0
			for (i=l+1; i< k+1; i++)
			{	
				g= e[i]
				y= q[i]
				h= s*g
				g= c*g
				z= pythag(f,h)
				e[i-1]= z
				c= f/z
				s= h/z
				f= x*c+g*s
				g= -x*s+g*c
				h= y*s
				y= y*c
				for (j=0; j < n; j++)
				{	
					x= v[j][i-1]
					z= v[j][i]
					v[j][i-1] = x*c+z*s
					v[j][i] = -x*s+z*c
				}
				z= pythag(f,h)
				q[i-1]= z
				c= f/z
				s= h/z
				f= c*g+s*y
				x= -s*g+c*y
				for (j=0; j < m; j++)
				{
					y= u[j][i-1]
					z= u[j][i]
					u[j][i-1] = y*c+z*s
					u[j][i] = -y*s+z*c
				}
			}
			e[l]= 0.0
			e[k]= f
			q[k]= x
		} 
	}
		
	//vt= transpose(v)
	//return (u,q,vt)
	for (i=0;i<q.length; i++) 
	  if (q[i] < prec) q[i] = 0
	  
	//sort eigenvalues	
	for (i=0; i< n; i++)
	{	 
	//writeln(q)
	 for (j=i-1; j >= 0; j--)
	 {
	  if (q[j] < q[i])
	  {
	//  writeln(i,'-',j)
	   c = q[j]
	   q[j] = q[i]
	   q[i] = c
	   for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
	   for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
//	   u.swapCols(i,j)
//	   v.swapCols(i,j)
	   i = j	   
	  }
	 }	
	}
	
	return {U:u,S:q,V:v}
};


},{}],7:[function(require,module,exports){
//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.2'

!function(root, String){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  // Helper for toBoolean
  function boolMatch(s, matchers) {
    var i, matcher, down = s.toLowerCase();
    matchers = [].concat(matchers);
    for (i = 0; i < matchers.length; i += 1) {
      matcher = matchers[i];
      if (!matcher) continue;
      if (matcher.test && matcher.test(s)) return true;
      if (matcher.toLowerCase() === down) return true;
    }
  }

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'"
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
  reversedEscapeChars["'"] = '#39';

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.3.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;

      str = String(str);
      substr = String(substr);

      var count = 0,
        pos = 0,
        length = substr.length;

      while (true) {
        pos = str.indexOf(substr, pos);
        if (pos === -1) break;
        count++;
        pos += length;
      }

      return count;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      str  = String(str).toLowerCase();
      return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c ? c.toUpperCase() : ""; });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (!str) return 0;
      str = _s.trim(str);
      if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
      return parseNumber(parseNumber(str).toFixed(~~decimals));
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = typeof tsep == 'string' ? tsep : ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', ';
      lastSeparator = lastSeparator || ' and ';
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
          to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str, quoteChar) {
      return _s.surround(str, quoteChar || '"');
    },

    unquote: function(str, quoteChar) {
      quoteChar = quoteChar || '"';
      if (str[0] === quoteChar && str[str.length-1] === quoteChar)
        return str.slice(1,str.length-1);
      else return str;
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    naturalCmp: function(str1, str2){
      if (str1 == str2) return 0;
      if (!str1) return -1;
      if (!str2) return 1;

      var cmpRegex = /(\.\d+)|(\d+)|(\D+)/g,
        tokens1 = String(str1).toLowerCase().match(cmpRegex),
        tokens2 = String(str2).toLowerCase().match(cmpRegex),
        count = Math.min(tokens1.length, tokens2.length);

      for(var i = 0; i < count; i++) {
        var a = tokens1[i], b = tokens2[i];

        if (a !== b){
          var num1 = parseInt(a, 10);
          if (!isNaN(num1)){
            var num2 = parseInt(b, 10);
            if (!isNaN(num2) && num1 - num2)
              return num1 - num2;
          }
          return a < b ? -1 : 1;
        }
      }

      if (tokens1.length === tokens2.length)
        return tokens1.length - tokens2.length;

      return str1 < str2 ? -1 : 1;
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    },

    toBoolean: function(str, trueValues, falseValues) {
      if (typeof str === "number") str = "" + str;
      if (typeof str !== "string") return !!str;
      str = _s.trim(str);
      if (boolMatch(str, trueValues || ["true", "1"])) return true;
      if (boolMatch(str, falseValues || ["false", "0"])) return false;
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;
  _s.toBool   = _s.toBoolean;

  // Exporting

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = _s;

    exports._s = _s;
  }

  // Register as a named module with AMD.
  if (typeof define === 'function' && define.amd)
    define('underscore.string', [], function(){ return _s; });


  // Integrate with Underscore.js if defined
  // or create our own underscore object.
  root._ = root._ || {};
  root._.string = root._.str = _s;
}(this, String);

},{}]},{},[1])
;