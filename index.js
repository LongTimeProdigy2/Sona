const Discord = require("discord.js");
const {prefix, token} = require("./token.json");
const ytdl = require("ytdl-core");
const youtube = require("./src/Youtube");

const client = new Discord.Client();

const queue = new Map();

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

    if (message.content.startsWith(`${prefix}p`) || message.content.startsWith(`${prefix}ㅔ`)) {
        if(message.content.includes('www.youtube.com/')){
            execute(message, serverQueue);
        }
        else{
            let result = await youtube.Search(message.content.split(" ")[1]);
            console.log(result);
        }
        return;
    }
    else if(!isNaN(Number(message.content[1])) && typeof Number(message.content[1]) === 'number'){
        console.log(1111);
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

async function execute(message, serverQueue) {
    const args = message.content.split(" ");

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