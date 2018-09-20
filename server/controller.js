const functions = require('./functions');
const parks = require('./parks');
const moment = require('moment-timezone');

module.exports = {
   parkInfo: (req, res, next)=>{
        if(parks[req.params.park]){
                const cachedPark = functions.getCache(req.params.park);
                if(!functions.isClosed(cachedPark.openClose)){
                    res.send(cachedPark.parkInfo)
                }else{
                    const eastCoastTime = moment.tz(new Date(), "America/New_York").format("MM/DD/YYYY HH:mm a");
                    res.send(`This park is closed. ${eastCoastTime}`)
                }
        }else{
            res.send("Not a supported park")
        }
    },

    getBestPark: (req, res, next)=>{
        
        res.send(functions.getBestPark())
    }
}