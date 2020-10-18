const Channel = require("./src/Channel");
const YoutubeHelper = require('./src/Youtube');

const Discord = require('discord.js');
const client = new Discord.Client();
const token = require("./token.json");

const blackList = [];

const channelList = {};

const findList = {};

setInterval(() => {
    console.log(Object.keys(channelList));
}, 1000);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    this.helper = new YoutubeHelper(10);
});

client.on('message', async msg => {
    if (msg.content === 'ping') {
        msg.reply('Pong!');
        return;
    }
    if(msg.content.startsWith('?')){
        const author = msg.author;
        const authorId = author.id;

        if(blackList.includes(authorId)){
            console.log('블랙리스트 유저입니다.');
            return;
        }

        const user = msg.author.id;
        const voiceChannel = msg.member.voice.channel;
        const channelId = voiceChannel.id;
        const roomId = msg.member.guild.id;

        if(voiceChannel === null){
            console.log('보이스 채널에 입장하지 않은 요청입니다.');
            msg.reply('보이스 채널에 먼저 입장해주세요.');
            return;
        }

        var channel = null;
        if(!(channelId in channelList)){
            channelList[roomId] = new Channel(voiceChannel);
            console.log('first: ' + roomId);
        }
        else{
            console.log('second: ' + roomId);
        }
        channel = channelList[roomId];

        switch(msg.content[1]){
            case 'ㅓ':
            case 'j':
                channel.Join();
            break;
            case 'ㅂ':
            case 'q':
                channel.Leave();
            break;
            case 'ㅔ':
            case 'p':
                // let data = msg.content.slice(3);
                // channel.AddSong(msg);

                channel.Play();

                // url 또는 검색하여 url 설정
                // if(msg.content.includes('www.youtube.com/')){
                //     console.log('url이므로 직접 재생을 합니다.');
                //     let url = msg.content.split(" ")[1];

                //     if (!url) return msg.reply("재생할 주소를 입력해주세요.");

                //     let helper = new YoutubeHelper()

                //     // await DownloadAudioFromYoutube(url, null, voiceChannel);
                // }
                // else{
                //     let keyword = msg.content.slice(3);
                //     let count = 10;
                //     console.log(keyword, '검색을 시작합니다.');

                //     function fancyTimeFormat(duration)
                //     {   
                //         // Hours, minutes and seconds
                //         var mins = Math.floor((duration % 3600) / 60);
                //         var secs = duration % 60;

                //         // Output like "1:01" or "4:03:59" or "123:03:59"
                //         var ret = + mins + ':' + secs;
                //         return ret;
                //     }

                //     await FindURLFromYoutube(keyword, count)
                //     .then(datas => {
                //         findList[user] = datas;
                //         msg.reply(keyword + ' 검색결과\n' + 
                //         '1. ' + datas[0].title + ' ( ' + fancyTimeFormat(datas[0].duration) + ' )' + '\n' +
                //         '2. ' + datas[1].title + ' ( ' + fancyTimeFormat(datas[1].duration) + ' )' + '\n' +
                //         '3. ' + datas[2].title + ' ( ' + fancyTimeFormat(datas[2].duration) + ' )' + '\n' +
                //         '4. ' + datas[3].title + ' ( ' + fancyTimeFormat(datas[3].duration) + ' )' + '\n' +
                //         '5. ' + datas[4].title + ' ( ' + fancyTimeFormat(datas[4].duration) + ' )'
                //         );
                //     });
                // }
            break;
            case 's':
                // stop play
                msg.reply('노래를 정지하는 기능입니다. 아직 개발되지 않았습니다.');
            break;
            case 'ㅣ':
            case 'l':
                let songs = channel.songs;
                if(songs.length === 0){
                    msg.reply('현재 리스트에 재생할 곡이 없습니다.');
                }
                else{
                    let ret = "남은 곡 수: " + songs.length + '\n';
                    for(let i = 0; i < songs.length; ++i){
                        ret += (i + 1) + '. ' + songs[i] + '\n';
                    }
                    msg.reply(ret);
                }
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