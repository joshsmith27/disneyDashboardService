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
                    const eastCoastTime = moment.tz("America/New_York").format();
                    res.send(`This park is closed. ${new Date(eastCoastTime).toLocaleString('en-US')}`)
                }
        }else{
            res.send("Not a supported park")
        }
    },

    getBestPark: (req, res, next)=>{
        
        res.send(functions.getBestPark())
    }
}