const youtube = require('./Youtube');

module.exports = class Channel{
    constructor(voiceChannel, leaveCallBack){
        this.channel = voiceChannel;
        this.connection = null;
        this.dispatcher = null;
        this.songs = [];
        this.leaveCallBack = leaveCallBack;
    }

    async Join(){
        this.connection = await this.channel.join();
    }
    // static FindMp3(){}
    // static FindYoutube(){}
    async AddSong(url){
        // url 또는 검색하여 url 설정
        let title = await youtube.DownloadMP3(url);
        this.songs.push(title);

        if(this.songs.length === 1){
            this.Play();
        }
        else{

        }
    }
    // Play(){}
    async Play(){
        if(this.connection === null){
            this.connection = await this.channel.join();
        }

        let song = this.songs.shift();
        if(song === null) return;

        console.log('../musics/' + song + '.mp3');

        this.dispatcher = this.connection.play('../musics/' + song + '.mp3');
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
        this.leaveCallBack();
        this.leaveCallBack = null;
    }
}