#!/usr/bin/env node

const tmi = require('tmi.js');
const getUrls = require('get-urls');
const got = require('got');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/site/index.html');
});

http.listen(process.env.PORT, () => {
  console.log(`listening on *:${process.env.PORT}`);
});

io.on('connection', (socket) => {
    console.log('a browser connected');
    socket.on('disconnect', () => {
        console.log('browser disconnected');
    });
});

const client = new tmi.Client({
    connection: { reconnect: true },
    channels: require('./channels.json')
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    
    if (tags.mod || 'broadcaster' in tags.badges) {
        
        console.log(`==== ${channel} ====`)
        console.log(`${tags['display-name']}: ${message}`)
        
        const urls = getUrls(message)
        
        const urlList = Array.from(urls);
        
        urlList.forEach(url => {
            got(url).then(response => {
                const headers = response.headers;
                const contentType = headers['content-type'];
                
                const isImage = contentType.split('/')[0] === 'image';
                
                if (isImage) {
                    console.log(`"${url}" is an image`)
                    io.emit(channel, url);
                }
            })
        })
        
    }
});
