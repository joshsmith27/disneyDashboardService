const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios =  require('axios');
const app = express();
const path = require('path');
require('dotenv').config();
const controller = require('./server/controller')
const functions = require('./server/functions');

app.use(cors());
app.use(bodyParser.json());
// app.use('/', express.static('index.html'));


app.get('/api/wait_times/:park', controller.parkInfo)
app.get('/api/best_park', controller.getBestPark)
app.get('/api/all_parks', controller.getAllParks)

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
const port = process.env.PORT || 8070;

app.listen(port, ()=>{
    functions.syncCache();
    console.log(`listening on port ${port}`)
})