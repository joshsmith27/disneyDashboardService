const parks = require('./parks');
const moment = require('moment-timezone');
const sockets = require('./socket');
let cachedParks = [];

const checkActiveLength = (times) => {
    return times.filter((time)=>{
        return time.waitTime > 0
    }).length
}

const getAverage = (times) => {
  return  (times.reduce((total, time)=>{
        total += time.waitTime
        return total;
    }, 0) / checkActiveLength(times)).toFixed(0);
}

const getLongestShortest = (times) => {
    return times.reduce((ride, time)=>{
        if(ride.longest.waitTime === undefined && time.active && time.waitTime > 0 || !ride.shortest.waitTime === undefined && time.active){
       // if(ride.longest.waitTime === undefined || !ride.shortest.waitTime === undefined){
            ride.longest = time;
            ride.shortest = time;
        }
        if(time.waitTime > ride.longest.waitTime && time.active){
            ride.longest = time;
        }
        if(time.waitTime > 0 && time.waitTime < ride.shortest.waitTime && time.active  ){
            ride.shortest = time;
        }
        return ride;
    }, {shortest:{}, longest:{}})
}

const getParkInfo = (times, openClose) => {
    const longestAndShortest = getLongestShortest(times)
    return {
        average: getAverage(times),
        longest: longestAndShortest.longest,
        shortest: longestAndShortest.shortest,
        open: new Date(openClose.openingTime),
        close: new Date(openClose.closingTime),
        allRides: times.filter(time => time.active).map( ({name, waitTime}) => {return {name, waitTime}})
    };
}

const checkCache = (name) => {
    const filterCache = cachedParks.reduce((bool, park) => {
        if(name === park.name && park.time < new Date().getTime()){
            bool = true;
        }
        return bool;
    }, false)

    if(filterCache){
        cachedParks = cachedParks.filter((park)=>park.name !== name)
    }
    
    return cachedParks.reduce((bool, park) => {
        if(name === park.name){
            bool = true;
        }
        return bool;
    }, false);
} 

const syncCache = (app) => {
    const keys = Object.keys(parks);
    const getParks  = keys.reduce((bool, key) => {
        if(!checkCache(key)){
            bool = true;
        }
        return bool
    },false);
    if(getParks){
       const parkPromises = []; 
       keys.forEach((park)=>{
            parkPromises.push(parks[park].GetWaitTimes())
            parkPromises.push(parks[park].GetOpeningTimes())
            
       })
       Promise.all(parkPromises)
        .then((parks) => {
            console.log('We got data')
            const dataToSave = [];
            const db = app.get('db');
            let j = 0;
            for(let i = 0; i < parks.length; i+=2){
                const parkInfo = getParkInfo(parks[i], parks[i+1][0]);
                const dt = moment.tz(new Date(),"America/New_York").format("MM/DD/YYYY HH:mm:ss"); 
                const dateToSave = new Date(dt)
                const eastCoastTime = moment.tz(new Date(), "America/New_York").format("MM/DD/YYYY hh:mm a");
                parks[i]
                cachedParks.push(
                    {
                        nowEastCoast:eastCoastTime,
                        time:new Date().getTime() + (3 * 60 * 1000), 
                        name:keys[j],
                        parkInfo,
                        times:parks[i],
                        openClose:parks[i+1],
                    }
                )



                // parks[i].forEach((ride)=>{
                //     if(ride.waitTime > 0){
                //         dataToSave.push(db.wait_time.insert({park_name:ride.id.split('_')[0], ride_id:ride.id, date_time:dateToSave, wait_time:ride.waitTime}))
                //     }
                // })
                 j++
            }

            sockets.getParkDetails(app, 'disneyMagicKingdom', getParkDetails('disneyMagicKingdom'));
            sockets.getParkDetails(app, 'disneyEpcot', getParkDetails('disneyEpcot'));
            sockets.getParkDetails(app, 'disneyAnimalKingdom', getParkDetails('disneyAnimalKingdom'));
            sockets.getParkDetails(app, 'disneyHollywoodStudios', getParkDetails('disneyHollywoodStudios'));
            sockets.getBestPark(app, getBestPark());
            sockets.getAllParks(app, getAllParks());

            if(dataToSave.length > 0){
                    Promise.all(dataToSave)
                    .then((saveTimes)=>{
                        console.log('Data Saved')
                        syncCache(app)
                    })
                    .catch((error)=>{
                        console.log('Data Not Saved')
                        syncCache(app)
                    })
            }else{
                syncCache(app)
            }
            
        })
        .catch((e)=>{

            console.log('Something broke. Rerunning function')
            syncCache(app)
        })
    }else{
        console.log('Waiting for 30 seconds')
        setTimeout(() => syncCache(app), (30 * 1000))
    }
}

const getCache = (name) =>{
    return cachedParks.reduce((obj,park)=>{
         if(name === park.name){
             obj = park;
         }
         return obj
     }, {})
 }; 

const isClosed = (times)=>{
    const dt = new Date();
    const eastCoastTime = moment.tz(dt,"America/New_York").valueOf();
    if(moment.tz(times[0].openingTime, "America/New_York").valueOf() <= eastCoastTime){
        return moment.tz(times[0].closingTime, "America/New_York").valueOf() < eastCoastTime ? true : false;
    }else{
        return true;
    }
};

const getAllParks = () =>{
   return cachedParks.map((park)=>{
        switch(park.name){
          case'disneyAnimalKingdom':
            park.park = 'Animal Kingdom'
            break;
          case'disneyEpcot':
            park.park = 'Epcot'
            break;
          case'disneyMagicKingdom':
            park.park = 'Magic Kingdom'
            break;
          case'disneyHollywoodStudios':
            park.park = 'Hollywood Studios'
            break;
          default:
            break;
        }
        return {name: park.name, park:park.park, average: park.parkInfo.average}
    })
}

const getParkDetails = (park) => {
    if(parks[park]){
        const cachedPark = getCache(park);
        if(!isClosed(cachedPark.openClose)){
            return cachedPark.parkInfo
        }else{
            const eastCoastTime = moment.tz(new Date(), "America/New_York").format("MM/DD/YYYY HH:mm a");
            return `This park is closed. ${eastCoastTime}`; 
        }
    }else{
        return "Not a supported park"
    }
}

const getBestPark = ()=>{
    const allParksClosed = cachedParks.reduce((bool, park)=>{
        if(!isClosed(park.openClose)){
            bool = false;
        }
        return bool
    },true)

    if(!allParksClosed){
       return cachedParks.reduce((bestPark, park)=>{
            if(!bestPark.parkInfo){
                if(!isNaN(park.parkInfo.average)){
                    bestPark = park;
                }
            }else{
                if(Number(bestPark.parkInfo.average) > Number(park.parkInfo.average)){
                    bestPark = park;
                }
            }
            return bestPark;
        },{});
    }else{
        const eastCoastTime = moment.tz(new Date(), "America/New_York").format("MM/DD/YYYY HH:mm a");
         return `All parks are closed ${eastCoastTime}`;
    }

};

module.exports = {
    isClosed,
    getCache,
    getBestPark,
    syncCache,
    getAllParks,
    getParkDetails
}



