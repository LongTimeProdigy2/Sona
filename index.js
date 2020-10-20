const Discord = require("discord.js");
const {prefix, token} = require("./token.json");
const ytdl = require("ytdl-core");
const youtube = require("./src/Youtube");

const client = new Discord.Client();

const queue = new Map();

const findList = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    const user = message.author.id;

    if (message.content.startsWith(`${prefix}p`) || message.content.startsWith(`${prefix}ㅔ`)) {
        if(message.content.includes('www.youtube.com/')){
            execute(message, serverQueue, message.content.split(" "));
        }
        else{
            function fancyTimeFormat(duration)
            {   
                // Hours, minutes and seconds
                var mins = Math.floor((duration % 3600) / 60);
                var secs = duration % 60;

                // Output like "1:01" or "4:03:59" or "123:03:59"
                var ret = + mins + ':' + secs;
                return ret;
            }
            
            let keyword = message.content.slice(3);
            console.log(keyword);
            await youtube.Search(keyword)
            .then(datas => {
                findList.set(user, datas);
                message.reply(keyword + ' 검색결과\n' + 
                '1. ' + datas[0].title + ' ( ' + fancyTimeFormat(datas[0].duration) + ' )' + '\n' +
                '2. ' + datas[1].title + ' ( ' + fancyTimeFormat(datas[1].duration) + ' )' + '\n' +
                '3. ' + datas[2].title + ' ( ' + fancyTimeFormat(datas[2].duration) + ' )' + '\n' +
                '4. ' + datas[3].title + ' ( ' + fancyTimeFormat(datas[3].duration) + ' )' + '\n' +
                '5. ' + datas[4].title + ' ( ' + fancyTimeFormat(datas[4].duration) + ' )'
                );
            });
        }
        return;
    }
    else if(!isNaN(Number(message.content[1])) && typeof Number(message.content[1]) === 'number'){
        console.log(1111);
        if(findList.has(user)){
            let result = findList.get(user)[message.content[1]];
            let url = result.url;
            console.log(url);
            execute(message, serverQueue, ['?p', url]);
        }
        else{
            message.reply('검색할 키워드를 먼저 입력하십시오.');
        }
    }
    else if(message.content.startsWith(`${prefix}n`) || message.content.startsWith(`${prefix}ㅜ`)){
        skip(message, serverQueue);
        return;
    }
    else if(message.content.startsWith(`${prefix}s`) || message.content.startsWith(`${prefix}ㄴ`)){
        stop(message, serverQueue);
        return;
    }
    else if(message.content.startsWith(`${prefix}h`) || message.content.startsWith(`${prefix}ㅗ`)){
        message.channel.send(
            '?: 기본키입니다.\n' + 
            'ㆍ p or ㅔ: play. url 또는 유튜브에서 검색할 키워드를 입력하세요.\n' + 
            'ㆍ n or ㅜ: next\n' + 
            'ㆍ s or ㄴ: stop'
            );
    }
    else {
        message.channel.send("You need to enter a valid command!");
    }
});

async function execute(message, serverQueue, args) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send("음성 채널에 먼저 입장하여 주세요.");

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send("음성 채널에 먼저 입장하여 주세요.");
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
    else{
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} 재생목록에 추가되었습니다!`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");

    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");

    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Now Playing: **${song.title}**`);
}

client.login(token);