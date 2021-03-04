const Discord = require("discord.js");
const {foodprefix, prefix, token} = require("./token.json");
const ytdl = require("ytdl-core");
const youtube = require("./src/Youtube");
const fs = require("fs");

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
            value.message.delete();
            // value.message.edit(`${musicData.title} 재생을 시작합니다.`);
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
            `\`\`\`
· ?: 기본키입니다.
· p or ㅔ: [play] 재생할 곡의 URL(유튜브) 또는 키워드를 입력하세요.
· n or ㅜ: [next] 다음 곡으로 넘어갑니다. 곡이 없을 시 Sona가 퇴장합니다.
· s or ㄴ: [stop] 소나가 노래를 정지하고 퇴장합니다.
· 메뉴추가: 추천할 메뉴 목록에 해당 메뉴를 추가합니다.
· 메뉴삭제: 추천할 메뉴 목록에 해당 메뉴를 제거합니다.
· 메뉴전체: 추천할 메뉴의 모든 목록을 보여줍니다.
· 메뉴판  : 메뉴 목록에서 하나를 뽑아와 메뉴를 추천합니다.
            \`\`\``
            );
    }
    else if(message.content.startsWith(`${prefix}메뉴추가`)){
        AddFood(message);
    }
    else if(message.content.startsWith(`${prefix}메뉴삭제`)){
        RemoveFood(message);
    }
    else if(message.content.startsWith(`${prefix}메뉴추천`)){
        RandomFood(message);
    }
    else if(message.content.startsWith(`${prefix}메뉴판`)){
        AllFood(message);
    }
    else {
        message.channel.send("올바른 값을 입력해주세요!");
    }
});

function AddFood(message){
    if(!fs.existsSync(`./${foodprefix}_${message.guild.id}.json`)){
        fs.writeFileSync(`./${foodprefix}_${message.guild.id}.json`, "[]");
    }

    const dataBuffer = fs.readFileSync(`./${foodprefix}_${message.guild.id}.json`);
    const body = JSON.parse(dataBuffer);
    const food = message.content.slice(5);
    if(body.indexOf(food) == -1){
        body.push(food);
        message.reply(`${food} 메뉴가 추가 되었습니다.`);
        fs.writeFileSync(`${foodprefix}_${message.guild.id}.json`, JSON.stringify(body));
    }
    else{
        message.reply(`${food} 메뉴는 중복입니다.`);
    }
}

function RemoveFood(message){
    if(fs.existsSync(`./${foodprefix}_${message.guild.id}.json`)){
        const dataBuffer = fs.readFileSync(`./${foodprefix}_${message.guild.id}.json`);
        const body = JSON.parse(dataBuffer);
        const food = message.content.slice(5);
        const index = body.indexOf(food);    

        if(index != -1){
            body.splice(index, 1);
            message.reply(`${food} 메뉴가 삭제 되었습니다.`);
            fs.writeFileSync(`${foodprefix}_${message.guild.id}.json`, JSON.stringify(body));
        }
        else{
            message.reply(`${food} 메뉴는 이미 목록에 없습니다.`);
        }
    }
    else{
        message.reply(`현재 이 방에서 생성된 메뉴판이 없습니다.`);
    }
}

function RandomFood(message){
    if(fs.existsSync(`./${foodprefix}_${message.guild.id}.json`)){
        const dataBuffer = fs.readFileSync(`./${foodprefix}_${message.guild.id}.json`);
        const body = JSON.parse(dataBuffer);
        
        if(body.length == 0){
            message.reply(`메뉴가 존재하지 않습니다.`);
        }
        else{
            const index = Math.floor(Math.random() * body.length);
            message.reply(`${body[index]}을(를) 드시는 게 좋겠어요.`);
        }
    }
    else{
        message.reply(`메뉴를 고를 메뉴판이 없어요!`);
    }
}

function AllFood(message){
    if(fs.existsSync(`./${foodprefix}_${message.guild.id}.json`)){
        const dataBuffer = fs.readFileSync(`./${foodprefix}_${message.guild.id}.json`);
        const body = JSON.parse(dataBuffer);

        if(body.length == 0){
            message.reply(`메뉴가 존재하지 않습니다.`);
        }
        else{
            let sentence = "\`\`\`✔ 메뉴판 ✔\n\n";
            sentence += body[0];
            for(let i = 1; i < body.length; ++i){
                sentence += `, ${body[i]}`
            }
            sentence += "\`\`\`";
            message.reply(`${sentence}`);
        }
    }
    else{
        message.reply(`보여줄 수 있는 메뉴판이 없어요!`);
    }
}

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
            connection.on("disconnect", () => {
                console.log("disconnect");
                // leave(message.guild, queueContruct);
                queue.delete(message.guild.id);
            });
        } catch (err) {
            console.log(err);
            message.channel.send(err);
            leave(message.guild, queueContruct);
        }
    }
}

async function leave(guild, serverQueue){
    if(serverQueue){
        console.log("Leave: disconnect");
        serverQueue.voiceChannel.leave();
    }
    else{
        console.log("serverQueue empthy");
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
                ret += i + '. ' + datas[i].title + ' (' + fancyTimeFormat(datas[i].duration) + ")\n"
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
    await join(message);

    const serverQueue = queue.get(message.guild.id);

    if (serverQueue) {
        try{
            // const songInfo = await ytdl.getInfo(args[1], {filter: 'audioonly'});
            const info = await youtube.GetInfoById(args[1].split("=")[1]);
            const song = {
                title: info.items[0].snippet.title,
                url: args[1],
                length: 0
            };

            serverQueue.songs.push(song);
            if(serverQueue.playing){
                message.channel.send(`${song.title} 재생목록에 추가되었습니다!`);
            }
            else{
                play(message.guild);
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

function play(guild) {
    const serverQueue = queue.get(guild.id);
    if(!serverQueue){
        return;
    }

    let song = serverQueue.songs.shift();
    if (!song) {
        leave(guild.id, serverQueue);
        // serverQueue.voiceChannel.leave();
        // queue.delete(guild.id);
        return;
    }

    serverQueue.playing = true;
    console.log(song.title, "재생을 시작합니다.");
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, { filter: "audioonly", quality: 'highestaudio', highWaterMark: 1 << 25 }))
        .on("finish", () => {
            // let tempSong = serverQueue.songs.shift();
            play(guild);
        })
        .on("error", error => {
            console.error("플레이 도중 에러가 발생했습니다.\n", error);
            serverQueue.textChannel.send(`플레이 도중 에러가 발생했습니다.\n \`\`\`${error}\`\`\``);
            leave(guild.id, serverQueue);
        });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Now Playing: **${song.title} (${song.length})**`);
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
                ret += (i + 1) + '. ' + songs[i].title + ' (' + songs[i].length + ' soconds)' + '\n';
            }
            message.reply(ret);
        }
    }
}

client.login(token);