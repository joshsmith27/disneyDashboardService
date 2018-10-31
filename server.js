const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios =  require('axios');

const app = express();
const path = require('path');
require('dotenv').config();
const controller = require('./server/controller')
const functions = require('./server/functions');
const massive = require('massive');
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.set('parkSocket', io
    .of('/park')
    .on('connection', (socket)=>{
    
        console.log('a user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
    })
);

massive(process.env.CONNECTION_STRING)
    .then((dbInstance)=>{
        app.set('db', dbInstance);
        functions.syncCache(app);
        console.log('connected To Db')
    })

app.use(cors());
app.use(bodyParser.json());
// app.use('/', express.static('index.html'));


app.get('/api/wait_times/:park', controller.parkInfo);
app.get('/api/best_park', controller.getBestPark);
app.get('/api/all_parks', controller.getAllParks);

app.get('/api/set_db', controller.set_db);

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
const port = process.env.PORT || 8070;

http.listen(port, ()=>{
    console.log(`listening on port ${port}`)
})