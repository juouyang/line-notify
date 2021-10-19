#!/bin/env node

const express        = require('express');
const bodyParser     = require('body-parser');
const path           = require('path');
const fs             = require('fs');
const request        = require("request");
const http           = require('http');
const app            = express();
const PORT           = process.env.OPENSHIFT_NODEJS_PORT || 8888 ;
const ADDR           = process.env.OPENSHIFT_NODEJS_IP   || '0.0.0.0' ;

// LINE Notify
const OAUTH_PAGE     = 'http://line-notify.apps.ocp.testing/oauth.html';
const OAUTH_REDIRECT = 'http://line-notify.apps.ocp.testing/add-notify-user';
const NFY_API        = 'https://notify-api.line.me/api/notify';
const NFY_TOKEN_API  = 'https://notify-bot.line.me/oauth/token';
const NFY_CLIENT_ID  = process.env.CLIENT_ID;
const NFY_CLIENT_SECRET = process.env.CLIENT_SECRET;
const NOTIFY_FILE    = 'notify-users.json';
let   notifyUsers    = {};

const sendNotify = (token, message) => {
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: NFY_API,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      form: {
        'message': message
      }
    }, (err, response, body) => {
      if (err) {
        return reject(err);
      } else {
        console.log('Response: ', body);
        return resolve(body);
      }
    });
  });
};

const getNotifyToken = (code) => {
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: NFY_TOKEN_API,
      form: {
        "grant_type": "authorization_code",
        "redirect_uri": OAUTH_REDIRECT,
        "client_id": NFY_CLIENT_ID,
        "client_secret": NFY_CLIENT_SECRET,
        "code": code,
      },
    }, (err, response, body) => {
      if (err) {
        return reject(err);
      } else {
        console.log('Response: ', body);
        return resolve(body);
      }
    });
  });
};

const readFile = (file) => {
  let ret = {};
  try {
    let data = fs.readFileSync(file, 'utf8');
    if(data) {
      ret = JSON.parse(data);
    }
  } catch(e) {
    console.dir(e);
  } finally {
    return ret;
  }
};

const writeFile = (file, data) => {
  try {
    let _data = JSON.stringify(data);
    fs.writeFileSync(file, _data, 'utf8');
  } catch(e) {
    console.dir(e);
  }
};

app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  notifyUsers = readFile(NOTIFY_FILE);
  return next();
});

app.get('/health', (req, res) => {
  return res.end();
});

// callback function after user sign up to LINE Nofigy
app.get('/add-notify-user', async(req, res) => {
  try {
    let code = req.query.code;
    let body = await getNotifyToken(code);
    if(!body) {
      throw 'Not found access_token!';
    } else {
      body = JSON.parse(body);
    }
    notifyUsers[code] = {};
    notifyUsers[code].token = body.access_token;
    notifyUsers[code].state = req.query.state;
    writeFile(NOTIFY_FILE, notifyUsers);
    return res.send('Success to save! Code=' + req.query.code + '\nState=' + req.query.state);
  } catch(e) {
    console.dir(e);
    return res.status(400).send('Failed to add user! Code=' + req.query.code + '\nState=' + req.query.state);
  }
});

// Send LINE Notify test message
app.get('/line-notify', async(req, res) => {
  let message = req.query.message ? req.query.message : 'Test Message!';
  for(let code in notifyUsers) {
    if(!(notifyUsers[code] && notifyUsers[code].token)) {
      continue;
    }
    try {
      let token = notifyUsers[code].token;
      await sendNotify(token, message);
    } catch(e) {
      console.dir(e);
    }
  }
  return res.end();
});

app.listen(PORT, ADDR, () => {
  console.log(`Worker ${process.pid} started at Port ${PORT}`);
});

