// http://stackoverflow.com/a/3177838/3243018
// Or use http://momentjs.com/
/*
    Modified by puffball.io developers 
    To solve an issue where time evaluates to negative
*/


function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    // modification by puffball.io
    if(seconds < 0) return "Just now";
    // end modification

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}