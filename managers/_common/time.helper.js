module.exports = {
    getHour12: ()=>{
        let time = new Date();
        let hours = time.getHours()
        hours = (hours % 12) || 12;
        return hours;
    },
    getWeek4: ()=>{
        const d = new Date();
        const date = d.getDate();
        const day = d.getDay();
        const weekOfMonth = Math.ceil((date - 1 - day) / 7);
        return weekOfMonth;
    },
    getTimeInMinutes: ()=>{
        let milli = new Date().getTime();
        return Math.floor(milli / 60000);
    }
}