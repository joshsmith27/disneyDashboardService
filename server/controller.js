const functions = require('./functions');
const parks = require('./parks');
const moment = require('moment-timezone');

module.exports = {
   parkInfo: (req, res, next)=>{
        res.send(functions.getParkDetails(req.params.park))
    },

    getBestPark: (req, res, next)=>{

        res.send(functions.getBestPark(req.app))
    },

    getAllParks: (req,res,next) => {
        res.send(functions.getAllParks(req.app))
    },

    set_db: (req,res, next)=>{
        const keys = Object.keys(parks);
        const db = app.get('db');
        let flattenedRides = [];
        const parkPromises = keys.map((key)=>{
           return parks[key].GetWaitTimes();
        })
        Promise.all(parkPromises)
            .then((rides)=>{
            
                flattenedRides = rides.reduce((arr, ride)=>{
                    ride.forEach((waitTime)=>{
                        arr.push(waitTime)
                    })
                    return arr
                })
               return db.ride.find();
            })
            .then((rides)=>{
                
                const ridesToAdd = [];
    
                flattenedRides.forEach((ride)=>{
                    const bool = rides.reduce((boo, fRide)=>{
                        const name = ride.name.split(' - ')[0]
                        if(fRide.name === name){
                            boo = true;
                        }
                        return boo;
                    }, false)
    
                    if(!bool){
                        ridesToAdd.push(ride)
                    }
                })
    
                const allWaitTimePromise =  ridesToAdd.map((ride)=>{
                    const parkName = ride.id.split('_')[0];
                    const name = ride.name.split(' - ')[0];
                    return db.ride.insert({ride_id: ride.id, name, park_name:parkName});
                })
                return Promise.all(allWaitTimePromise);
            })
            .then((response)=>{
               res.send('That worked')
            })
    }
}