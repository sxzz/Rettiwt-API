// PACKAGE LIBS
import express from 'express';

// CUSTOM LIBS
import { config } from './config/env';
import { TweetFilter } from './schema/types/TweetData';
import { AuthService } from './services/DataServices/AuthService';
import { TweetService } from './services/DataServices/TweetService';
import { UserAccountService } from './services/DataServices/UserAccountService';

// Initialising express instance
const app = express();

// Creating root end point
app.use('/', (req, res) => {
    res.send("Hello World");    
})

// Setting up express server
app.listen(config['server']['port'], () => {
    console.log(`Listening on port ${config['server']['port']}`);

    var service = new TweetService(
        config['twitter']['auth']['authToken'],
        config['twitter']['auth']['csrfToken'],
        config['twitter']['auth']['cookie']
    );

    service.getTweets(new TweetFilter({
        words: [],
        fromUsers: ['negmatico'],
        toUsers: [],
        mentions: [],
        hashtags: [],
        startDate: '',
        endDate: '',
        count: 10
    }), '')
    .then(res => console.log(res.data));
});