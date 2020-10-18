module.exports = class Channel{
    constructor(voiceChannel){
        this.channel = voiceChannel;
        this.connection = null;
        this.dispatcher = null;
        this.songs = [];
    }

    async Join(){
        this.connection = await this.channel.join();
    }
    // static FindMp3(){}
    // static FindYoutube(){}
    AddSong(message){
        // url 또는 검색하여 url 설정
        // if(message.includes('www.youtube.com/')){
        //     console.log('url이므로 직접 재생을 합니다.');
        //     let url = message;

        //     if (!url) return msg.reply("재생할 주소를 입력해주세요.");
        //     await DownloadAudioFromYoutube(url, null, voiceChannel);
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
    }
    // Play(){}
    async Play(){
        if(this.connection === null){
            this.connection = await this.channel.join();
        }

        // let song = this.songs.shift();
        // if(song === null) return;

        this.dispatcher = this.connection.play('./musics/With_Me.mp3');
        this.dispatcher.on('finish', () => {
            if(this.songs.length === 0){
                this.Leave();
            }
            else{
                this.Play();
            }
        });
    }
    
    // Pause(){}
    // Resume(){}
    Leave(){
        this.channel.leave();
        this.channel = null;
        this.connection = null;
        this.dispatcher = null;
    }
}