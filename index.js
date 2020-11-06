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
    if(message.content.startsWith(`${prefix}j`) || message.content.startsWith(`${prefix}ㅓ`)){
        join(message);
    }
    else if(message.content.startsWith(`${prefix}q`) || message.content.startsWith(`${prefix}ㅂ`)){
        leave(message.guild, serverQueue);
    }
    else if(message.content.startsWith(`${prefix}p`) || message.content.startsWith(`${prefix}ㅔ`)){
        if(message.content.includes('www.youtube.com/')){
            execute(message, message.content.split(" "));
        }
        else{
            SearchYoutube(message);
        }
    }
    else if(!isNaN(Number(message.content[1])) && typeof Number(message.content[1]) === 'number'){
        if(findList.has(user)){
            let value = findList.get(user);
            let musicData = value.data[message.content[1]];
            let url = musicData.url;
            value.message.edit(`${musicData.title} 재생을 시작합니다.`);
            execute(message, ['?p', url]);
        }
        else{
            message.reply('검색할 키워드를 먼저 입력하십시오.');
        }
    }
    else if(message.content.startsWith(`${prefix}l`) || message.content.startsWith(`${prefix}ㅣ`)){
        list(message, serverQueue);
    }
    else if(message.content.startsWith(`${prefix}n`) || message.content.startsWith(`${prefix}ㅜ`)){
        skip(message, serverQueue);
    }
    else if(message.content.startsWith(`${prefix}s`) || message.content.startsWith(`${prefix}ㄴ`)){
        stop(message, serverQueue);
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

async function join(message){
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send("음성 채널에 먼저 입장하여 주세요.");

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send("음성 채널에 먼저 입장하여 주세요.");
    }

    if (!queue.has(message.guild.id)) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: false
        };

        queue.set(message.guild.id, queueContruct);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
}

async function leave(guild, serverQueue){
    if(serverQueue){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
    }
}

async function SearchYoutube(message){
    function fancyTimeFormat(duration)
    {   
        // Hours, minutes and seconds
        var mins = Math.floor((duration % 3600) / 60);
        var secs = duration % 60;

        // Output like "1:01" or "4:03:59" or "123:03:59"
        var ret = + mins + ':' + secs;
        return ret;
    }
    
    const user = message.author.id;
    let keyword = message.content.slice(3);
    try{
        await youtube.Search(keyword)
        .then(datas => {
            let ret = keyword + "검색결과\n";
            for(let i = 0; i < datas.length; ++i){
                ret += i + '. ' + datas[i].title + '(' + fancyTimeFormat(datas[i].duration) + ")\n"
            }
            message.reply(ret)
            .then((msg) => {
                findList.set(user, {message: msg, data: datas});
            })
        });
    }
    catch(err){
        console.log(err);
        message.reply('유튜브 검색 도중 오류가 발생했습니다.');
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
    if(serverQueue.connection.dispatcher){
        serverQueue.connection.dispatcher.end();
    }
}

async function execute(message, args) {
    join(message);

    console.log("excute: ", args);

    const serverQueue = queue.get(message.guild.id);
    if (serverQueue) {
        try{
            const songInfo = await ytdl.getInfo(args[1]);
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                length: songInfo.videoDetails.lengthSeconds
            };

            if(serverQueue.playing){
                serverQueue.songs.push(song);
                message.channel.send(`${song.title} 재생목록에 추가되었습니다!`);
            }
            else{
                play(message.guild, song);
            }
        }
        catch(err){
            console.log(err);
            message.reply('동영상 정보 찾는 중에 오류가 발생했습니다.' + '```\n' + err + '\n```');
        }
        
    }
    else{
        message.reply('재생이 불가합니다.');
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    serverQueue.playing = true;
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, {quality: 'highestaudio', highWaterMark: 1 << 25}))
        .on("finish", () => {
            let tempSong = serverQueue.songs.shift();
            play(guild, tempSong);
        })
        .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Now Playing: **${song.title}(${song.length})**`);
}

function list(message, serverQueue){
    if(serverQueue){
        let songs = serverQueue.songs;
        if(songs.length === 0){
            message.reply('현재 리스트에 재생할 곡이 없습니다.');
        }
        else{
            let ret = "남은 곡 수: " + songs.length + '\n';
            for(let i = 0; i < songs.length; ++i){
                ret += (i + 1) + '. ' + songs[i].title + '(' + songs[i].length + ' soconds)' + '\n';
            }
            message.reply(ret);
        }
    }
}

client.login(token);