/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
require('dotenv').config()
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
var AWS = require("aws-sdk")

const config ={
  region: "us-east-1",
  adminEmail: "andrew.obrigewitsch@lexisnexis.com"
}

var ses = new AWS.SES(config);

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});


const chargeHandler = (req, res, next) => {
  const { token} = req.body;
  const {currency, amount, description } = req.body.charge;
  stripe.charges.create({
    source: token.id,
    amount,
    currency,
    description
  })
  .then(charge => {
    req.charge = charge;
    req.description = description;
    if(charge.status==='succeeded'){
      next()
    }
  })
  .catch(err => res.status(500).json({stripeError: err}))
}

const emailHandler = (req, res) => {
  const { charge } = req;
  ses.sendEmail({
    Source: config.adminEmail,
    ReturnPath: config.adminEmail,
    Destination: {
      ToAddresses: [config.adminEmail]
    },
    Message: {
      Subject: {
        Data: 'Order Details - AmplifyAgora'
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: '<h3>Oder Processed!</h3>',

        }
      }
    }
  }, (err, data)=> {
    if(err) {
      return res.status(500).json({ emailError: err})
    }
    res.json({
      message: "Order processed successfully!",
      charge, 
      data
    })
  });
};

/****************************
* Example post method *
****************************/

app.post('/charge', chargeHandler, emailHandler);


app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
