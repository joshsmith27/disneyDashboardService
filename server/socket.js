
module.exports = {
    getAllParks: (app, data) => {
        const parkSocket = app.get('parkSocket');
        parkSocket.emit('parks', data)
    },
    
    getParkDetails: (app, park, data) => {
        const parkSocket = app.get('parkSocket');
        parkSocket.emit(park, data)
    },

    
    getBestPark: (app, data) => {
        const parkSocket = app.get('parkSocket');
        parkSocket.emit('best_park', data)
    },
    
}