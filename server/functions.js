const parks = require('./parks');
let cachedParks = [];

const checkActiveLength = (times) => {
    return times.filter((time)=>{
        return time.active
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
        if(ride.longest.waitTime === undefined && time.active || !ride.shortest.waitTime === undefined && time.active){
       // if(ride.longest.waitTime === undefined || !ride.shortest.waitTime === undefined){
            ride.longest = time;
            ride.shortest = time;
        }
        if(time.waitTime > ride.longest.waitTime && time.active){
            ride.longest = time;
        }
        if(time.waitTime < ride.shortest.waitTime && time.active){
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

const syncCache = () => {
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
            let j = 0;
            for(let i = 0; i < parks.length; i+=2){
                const parkInfo = getParkInfo(parks[i], parks[i+1][0]);
                cachedParks.push(
                    {
                        time:new Date().getTime() + (5 * 60 * 1000), 
                        name:keys[j],
                        parkInfo,
                        times:parks[i],
                        openClose:parks[i+1],
                    }
                )
                j++
            }
            syncCache() 
        })
        .catch(()=>{
            console.log('Something broke. Rerunning function')
            syncCache()
        })
    }else{
        console.log('Waiting for 30 seconds')
        setTimeout(syncCache, (30 * 1000))
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
    return new Date(times[0].closingTime).getTime() < (dt.getTime() + dt.getTimezoneOffset()*60*1000)   ?  true : false;
};

const getBestPark = ()=>{

    const allParksClosed = cachedParks.reduce((bool, park)=>{
        if(!isClosed(park.openClose)){
            bool = false;
        }
        return bool
    },true)

    if(!allParksClosed){
        return cachedParks.reduce((bestPark, park)=>{
            if(!bestPark.average || bestPark.average < park.average){
                bestPark = park;
            }
            return bestPark;
        },{})
    }else{
        return "All parks are closed"
    }

};

module.exports = {
    isClosed,
    getCache,
    getBestPark,
    syncCache,
}



