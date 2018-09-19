const functions = require('./functions');
const parks = require('./parks');

module.exports = {
   parkInfo: (req, res, next)=>{
        if(parks[req.params.park]){
                const cachedPark = functions.getCache(req.params.park);
                if(!functions.isClosed(cachedPark.openClose)){
                    res.send(cachedPark.parkInfo)
                }else{
                    res.send(`This park is closed.`)
                }
        }else{
            res.send("Not a supported park")
        }
    },

    getBestPark: (req, res, next)=>{
        
        res.send(functions.getBestPark())
    }
}