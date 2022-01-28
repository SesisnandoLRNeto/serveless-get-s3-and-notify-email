'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({ apiVersion: '2006-03-01' });

const https = require('https');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_TRIGGER,
    pass: process.env.PASS_TRIGGER,
  },
});

module.exports.handle = async (event, context, callback) => {
  const { Records: records } = event;
  let _body;
  let body_txt;

  const fillEmailBodyToSend = (info) => {
    body_txt =
      '<h2>Contact Details: </h2><br><p><strong>' + info + ' </strong></p>';
  };

  const getOptions = () => {
    return {
      from: process.env.EMAIL_TRIGGER,
      to: process.env.EMAIL_NOTIFIED,
      subject: 'Resources not found',
      html: body_txt,
    };
  };

  const done = (err, res) =>
    callback(null, {
      statusCode: err ? '400' : '200',
      body: err ? err.message : JSON.stringify(res),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
    });

  const IsUrl = (value) => {
    const regexp =
      /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(value);
  };

  const isObject = (value) => {
    return Object.prototype.toString.call(value) === '[object Object]'
      ? true
      : false;
  };

  const searchUrlIntoObject = (object) => {
    Object.values(object).map(async (value) => {
      if (IsUrl(value)) {
        await sendRequest(value);
      }
      if (isObject(value)) {
        return searchUrlIntoObject(value);
      }
    });
  };

  const sendRequest = async (url) => {
    const statusInvalid = ['404', '500', '403'];
    https
      .get(url, ({ statusCode }) => {
        if (statusInvalid.includes(statusCode.toString())) {
          fillEmailBodyToSend(url);
          const mailOptions = getOptions();
          transporter.sendMail(mailOptions, done(null, _body));
        }
      })
      .on('error', (error) => {
        console.error(error);
      });
  };

  try {
    await Promise.all(
      records.map(async (record) => {
        const { key } = record.s3.object;

        const keyConverted = decodeURIComponent(key.replace(/\+/g, ' '));
        const params = {
          Bucket: process.env.BUCKET,
          Key: keyConverted,
        };

        const result = await S3.getObject(params).promise();
        _body = JSON.parse(result.Body.toString());

        searchUrlIntoObject(_body);

        callback(null, result);
      })
    );

    return {
      statusCode: 200,
      body: { OK: true },
    };
  } catch (error) {
    return error;
  }
};
