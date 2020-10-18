const ytdl = require("ytdl-core");
const youtube_node = require("youtube-node");
const youtube = new youtube_node();
const youtube_api_key = 'AIzaSyAf0mXbOQKdFOktMsCiDKkbonGq-NZ_rKU';
youtube.setKey(youtube_api_key);

const request = require('request');

/**
 * 
 * @param {string} keyword 
 * @param {number} count 
 */
function FindURLFromYoutube(keyword, count){
    return new Promise((resolve, reject) => {
        // youtube.addParam('order', 'rating');
        // youtube.addParam('type', 'video');
        // youtube.addParam('videoLicense', 'creativeCommon');
        youtube.addParam('regionCode', 'kr');
        // youtube.addParam('videoDuration', 'medium');    // any / long(up 20) / medium(4~20) / short(down 4);

        youtube.search(keyword, count, async (err, result) => {
            if(err) reject(err);

            let items = result['items'];
            let urls = [];
            for (var i in items) { 
                let it = items[i];
                let title = it["snippet"]["title"];
                let video_id = it["id"]["videoId"];
                if(video_id === undefined) continue;
                let url = "https://www.youtube.com/watch?v=" + video_id;
                let duration = await GetDurationFromYoutube(video_id);
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

function GetDurationFromYoutube(id){
    return new Promise((resolve, reject) => {
        let url = 'https://www.googleapis.com/youtube/v3/videos?id=' + 
        id + 
        '&part=contentDetails&key=' + youtube_api_key;

        request(url, (err, res, body) => {
            let result = JSON.parse(body);
            resolve(convert_time(result.items[0].contentDetails.duration));
        });
    });
}
function GetTitleFromYoutube(id){
    return new Promise((resolve, reject) => {
        let url = 'https://www.googleapis.com/youtube/v3/videos?id=' + 
        id + 
        '&part=snippet&key=' + youtube_api_key;

        request(url, (err, res, body) => {
            let result = JSON.parse(body);
            resolve(result.items[0].snippet.title);
        });
    });
}

function convert_time(duration) {
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

/**
 * 
 * @param {string} title 
 * @param {string} url 
 */
function DownloadAudioFromYoutube(url, title = null, voiceChannel){
    return new Promise((resolve, reject) => {
        const stream = ytdl(url, {filter: 'audioonly'});
        stream.pipe(fs.createWriteStream(title + '.mp3'))
        .on('finish', () => {
            console.log(title, 'download finish');
            if(title === null){
                songList.push({title: GetTitleFromYoutube(url.split('=')[1]) + '.mp3'});
            }
            else{
                songList.push({title: title + '.mp3'});
            }

            Play(voiceChannel)

            resolve();
        });
    }) 
}

const fs = require('fs');

const Discord = require('discord.js');
const client = new Discord.Client();
const token = require("./token.json");

const blackList = [];

const voiceChannels = {};
const songList = [];
const findList = {};
var isSinging = false;
var isProcessing = false;

function Play(voiceChannel){
    if(isSinging){
        console.log('이미 재생중입니다.');
    }
    else{
        voiceChannel.join().then(connection => {
            let song = songList.shift();
            const dispatcher = connection.play(song.title);
            isSinging = true;
            dispatcher.on('finish', () => {
                isSinging = false;
                if(songList.length === 0){
                    voiceChannel.leave();
                }
                else{
                    Play(voiceChannel);
                }
            });
        });
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    // if(isProcessing){
    //     msg.reply('현재 다른 작업중에 있습니다.');
    //     return;
    // }

    // isProcessing = true;

    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }
    if(msg.content.startsWith('?')){
        const author = msg.author;
        const authorId = author.id;

        if(blackList.includes(authorId)) return;

        const user = msg.author.id;
        const voiceChannel = msg.member.voice.channel;
        const channelId = voiceChannel.id;
        console.log(channelId);

        switch(msg.content[1]){
            case 'ㅓ':
            case 'j':
                voiceChannels[channelId] = voiceChannel;
                voiceChannel.join().then(connection => {
                    msg.reply('채널에 입장했습니다.');
                })
            break;
            case 'ㅂ':
            case 'q':
                if(voiceChannel){
                    msg.reply('채널을 떠납니다.');
                    voiceChannel.leave();
                }
                else{
                    msg.reply('현재 들어간 채널이 없습니다.');
                }
            break;
            case 'ㅔ':
            case 'p':
                // 예외처리
                // 1. 요청 유저가 채널에 있는가?
                if(!voiceChannel){
                    return msg.reply('음성 채팅방에 들어가신 후 요청하여 주세요.');
                }            

                // url 또는 검색하여 url 설정
                if(msg.content.includes('www.youtube.com/')){
                    console.log('url이므로 직접 재생을 합니다.');
                    let url = msg.content.split(" ")[1];

                    if (!url) return msg.reply("재생할 주소를 입력해주세요.");
                    await DownloadAudioFromYoutube(url, null, voiceChannel);
                }
                else{
                    let keyword = msg.content.slice(3);
                    let count = 10;
                    console.log(keyword, '검색을 시작합니다.');

                    function fancyTimeFormat(duration)
                    {   
                        // Hours, minutes and seconds
                        var mins = Math.floor((duration % 3600) / 60);
                        var secs = duration % 60;

                        // Output like "1:01" or "4:03:59" or "123:03:59"
                        var ret = + mins + ':' + secs;
                        return ret;
                    }

                    await FindURLFromYoutube(keyword, count)
                    .then(datas => {
                        findList[user] = datas;
                        msg.reply(keyword + ' 검색결과\n' + 
                        '1. ' + datas[0].title + ' ( ' + fancyTimeFormat(datas[0].duration) + ' )' + '\n' +
                        '2. ' + datas[1].title + ' ( ' + fancyTimeFormat(datas[1].duration) + ' )' + '\n' +
                        '3. ' + datas[2].title + ' ( ' + fancyTimeFormat(datas[2].duration) + ' )' + '\n' +
                        '4. ' + datas[3].title + ' ( ' + fancyTimeFormat(datas[3].duration) + ' )' + '\n' +
                        '5. ' + datas[4].title + ' ( ' + fancyTimeFormat(datas[4].duration) + ' )'
                        );
                    });
                }
            break;
            case 's':
                // stop play
                msg.reply(msg.content.slice(3));
            break;
            case 'ㅣ':
            case 'l':
                let ret = "남은 곡 수: " + songList.length + '\n';
                for(let i = 0; i < songList.length; ++i){
                    ret += (i + 1) + '. ' + songList[i].title + '\n';
                }
                msg.reply(ret);
            break;
            default:
                let index = Number(msg.content[1]) - 1;
                if(user in findList){
                    const voiceChannel = msg.member.voice.channel;
                    if(!voiceChannel){
                        return msg.reply('음성 채팅방에 들어가신 후 요청하여 주세요.');
                    }  

                    if(index >= 0 && index <= 4){
                        let url = findList[user][index].url;
                        if (!url) return msg.reply("재생할 주소를 입력해주세요.");
                        await DownloadAudioFromYoutube(url, findList[user][index].title, voiceChannel);
                        delete user in findList;
                    }
                    else{
                        msg.reply('올바른 숫자를 입력해주세요.');    
                    }
                }
                else{
                    msg.reply('찾은 노래가 없습니다. 검색 후 지정해주세요.');
                }
            break;
        }

        // console.log(client.author.voice, client.author.voice.channel);
    }
});

client.login(token.token);