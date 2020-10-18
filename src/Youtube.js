const request = require('request');

const youtube_node = require("youtube-node");
const finder = new youtube_node();

const ytdl = require("ytdl-core");

const limitCount = 10;

module.exports = class Youtube{
    static GetList(keyword){
        return new Promise((resolve, reject) => {
            // youtube.addParam('order', 'rating');
            // youtube.addParam('type', 'video');
            // youtube.addParam('videoLicense', 'creativeCommon');
            finder.addParam('regionCode', 'kr');
            // youtube.addParam('videoDuration', 'medium');    // any / long(up 20) / medium(4~20) / short(down 4);
    
            finder.search(keyword, limitCount, async (err, result) => {
                if(err) reject(err);
    
                let items = result['items'];
                let urls = [];
                for (var i in items) { 
                    let it = items[i];
                    let title = it["snippet"]["title"];
                    let video_id = it["id"]["videoId"];
                    if(video_id === undefined) continue;
                    let url = "https://www.youtube.com/watch?v=" + video_id;
                    let duration = await this.GetDurationFromYoutube(video_id);
                    console.log("제목 : " + title);
                    console.log("URL : " + url);
                    console.log("duration : " + duration);
                    console.log("-----------");
    
                    urls.push({title: title, duration: duration, url: url});
                }
    
                resolve(urls);
            });
        });
    }

    GetDurationFromYoutube(id){
        return new Promise((resolve, reject) => {
            let url = 'https://www.googleapis.com/youtube/v3/videos?id=' + 
            id + '&part=contentDetails&key=' + youtube_api_key;
    
            request(url, (err, res, body) => {
                let result = JSON.parse(body);
                resolve(this.convert_time(result.items[0].contentDetails.duration));
            });
        });
    }

    convert_time(duration) {
        var a = duration.match(/\d+/g);
    
        if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
            a = [0, a[0], 0];
        }
    
        if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
            a = [a[0], 0, a[1]];
        }
        if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
            a = [a[0], 0, 0];
        }
    
        duration = 0;
    
        if (a.length == 3) {
            duration = duration + parseInt(a[0]) * 3600;
            duration = duration + parseInt(a[1]) * 60;
            duration = duration + parseInt(a[2]);
        }
    
        if (a.length == 2) {
            duration = duration + parseInt(a[0]) * 60;
            duration = duration + parseInt(a[1]);
        }
    
        if (a.length == 1) {
            duration = duration + parseInt(a[0]);
        }
        return duration
    }
}