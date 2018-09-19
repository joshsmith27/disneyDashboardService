const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios =  require('axios');
const app = express();
require('dotenv').config();
const controller = require('./server/controller')
const functions = require('./server/functions');

app.use(cors());
app.use(bodyParser.json());


app.get('/api/wait_times/:park', controller.parkInfo)
app.get('/api/best_park', controller.getBestPark)

const port = process.env.PORT || 8000;

app.listen(port, ()=>{
    functions.syncCache();
    console.log(`listening on port ${port}`)
})