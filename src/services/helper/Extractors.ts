// This file contains various methods for extracting raw data and parsing it into pre-defined types

// CUSTOM LIBS

// TYPES
import { Tweet } from '../../schema/types/TweetData';
import { User } from '../../schema/types/UserAccountData';
import { Errors } from '../../schema/types/HTTP';

// HELPERS
import { isJSONEmpty } from './Parser';
import {
    Data,
    destructureRawData
} from './Destructurers';

/* USERS */

/**
 * @returns The raw user account details
 * @param res The raw response received from Twitter
 */
export function extractUserAccountDetails(res: any): User {
    // Destructuring raw response
    var data = destructureRawData(res, Data.UserAccount);

    // Getting user account details data
    var user = data.required[0];
    
    return new User().deserialize(user);
}

/**
 * @returns The raw list of following of the target user from raw response data.
 * @param res The raw response received from TwitterAPI
 */
export function extractUserFollowing(res: any): { following: User[], next: string } {
    var following: User[] = [];
    var next: string = '';

    // If user does not exist
    if(isJSONEmpty(res['data']['user'])) {
        throw new Error(Errors.UserNotFound);
    }

    // Extracting the raw list of following
    //@ts-ignore
    res = res['data']['user']['result']['timeline']['timeline']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'];

    // Extracting cursor to next batch
    //@ts-ignore
    next = res.filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['value'].replace('|', '%7C');

    // Iterating over the raw list of following
    for (var entry of res) {
        // Checking if the entry is of type user
        if (entry['entryId'].indexOf('user') != -1) {
            // Adding the followed users to list of users
            following.push(new User().deserialize(entry['content']['itemContent']['user_results']['result']));
        }
    }

    return {
        following: following,
        next: next
    };
}

/**
 * @returns The raw list of followers of the target user from raw response data.
 * @param res The raw response received from TwitterAPI
 */
export function extractUserFollowers(res: any): { followers: User[], next: string } {
    var followers: User[] = [];
    var next: string = '';

    // If user does not exist
    if(isJSONEmpty(res['data']['user'])) {
        throw new Error(Errors.UserNotFound);
    }
    
    // Extracting the raw list of followers
    //@ts-ignore
    res = res['data']['user']['result']['timeline']['timeline']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'];

    // Extracting cursor to next batch
    //@ts-ignore
    next = res.filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['value'].replace('|', '%7C');

    // Itearating over the raw list of following
    for (var entry of res) {
        // Checking if the entry is of type user
        if (entry['entryId'].indexOf('user') != -1) {
            // Adding the follower to list of followers
            followers.push(new User().deserialize(entry['content']['itemContent']['user_results']['result']));
        }
    }

    return {
        followers: followers,
        next: next
    };
}

/**
 * @returns The raw list of tweets liked by the target user from raw response data.
 * @param res The raw response received from TwitterAPI
 */
export function extractUserLikes(res: any): { tweets: Tweet[], next: string } {
    var tweets: Tweet[] = [];
    var next: string = '';

    // If user does not exist
    if(isJSONEmpty(res['data']['user'])) {
        throw new Error(Errors.UserNotFound);
    }

    // Extracting the raw list of liked tweets
    //@ts-ignore
    res = res['data']['user']['result']['timeline_v2']['timeline']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'];

    // Extracting cursor to next batch
    //@ts-ignore
    next = res.filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['value'];

    // Itearating over the raw list of following
    for (var entry of res) {
        // Checking if the entry is of type user
        if (entry['entryId'].indexOf('tweet') != -1) {
            // Adding the tweet to list of liked tweets
            tweets.push(new Tweet().deserialize(entry['content']['itemContent']['tweet_results']['result']));
        }
    }

    return {
        tweets: tweets,
        next: next
    };
}

/* TWEETS */

/**
 * @returns The list of trending
 * @param res The raw response received from TwitterAPI
 */
export function extractTrending(res: any) {
    var trending: string[] = [];

    // Extracting raw list of trending from response
    //@ts-ignore
    res = res['timeline']['instructions'][1]['addEntries']['entries'].filter(item => item['entryId'] === 'trends')[0]['content']['timelineModule']['items'];

    // Parsing the raw list to string list
    for (var item of res) {
        trending.push(decodeURIComponent(item['entryId'].substring(item['entryId'].indexOf('trends-') + 'trends-'.length)).replace(/\+/g, ' ',));
    }

    return trending;
}

/**
 * @returns The raw list of tweets matching the given filter from raw response data.
 * @param res The raw response received from TwitterAPI
 */
export function extractTweets(res: any) {
    var tweets: Tweet[] = [];
    var next: '';

    console.log(destructureRawData(res, Data.Tweets));

    // Extracting the cursor to next batch
    // If not first batch
    if (res['timeline']['instructions'].length > 2) {
        next = res['timeline']['instructions'][2]['replaceEntry']['entry']['content']['operation']['cursor']['value'];
    }
    // If first batch
    else {
        //@ts-ignore
        next = res['timeline']['instructions'][0]['addEntries']['entries'].filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['operation']['cursor']['value'];
    }

    // Getting the raw list of tweets from response
    res = res['globalObjects']['tweets'];

    // If not empty, extracting tweets
    if (!isJSONEmpty(res)) {
        // Iterating through the json array of tweets
        for (var key of Object.keys(res)) {
            // Adding the tweets to the tweets list
            tweets.push(new Tweet().deserialize({ rest_id: res[key]['id_str'], legacy: res[key] }));
        }
    }

    return {
        tweets: tweets,
        next: next
    };
}

/**
 * @returns The required tweet from raw response data.
 * @param res The raw response received from TwitterAPI
 * @param tweetId The rest id of the tweet to fetch
 */
export function extractTweet(res: any, tweetId: string): Tweet {
    var tweet: Tweet;

    // If tweet does not exist
    if(isJSONEmpty(res['data'])) {
        throw new Error(Errors.TweetNotFound);
    }

    // Extracting required raw tweet from response
    //@ts-ignore
    res = res['data']['threaded_conversation_with_injections']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'].filter(item => item['entryId'].indexOf(tweetId) != -1)[0]['content']['itemContent']['tweet_results']['result'];

    // Storing the tweet in a tweet object
    tweet = new Tweet().deserialize(res);

    return tweet;
}

/**
 * @returns The raw list of likers of the target tweet from raw response data.
 * @param res The raw response received from TwitterAPI
 */
export function extractTweetLikers(res: any): { likers: User[], next: string } {
    var likers: User[] = [];
    var next: string = '';

    // If tweet does not exist
    if(isJSONEmpty(res['data']['favoriters_timeline'])) {
        throw new Error(Errors.TweetNotFound);
    }
    
    // Extracting raw likes list from response
    //@ts-ignore
    res = res['data']['favoriters_timeline']['timeline']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'];

    // Extracting cursor to next batch
    //@ts-ignore
    next = res.filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['value'];

    // Iterating over the raw list of likers
    for (var entry of res) {
        // Checking if entry is of type user
        if (entry['entryId'].indexOf('user') != -1) {
            // Adding the user to list of likers
            likers.push(new User().deserialize(entry['content']['itemContent']['user_results']['result']));
        }
    }

    return {
        likers: likers,
        next: next
    };
}

/**
 * @returns The raw list of retweeters of the target tweet from raw response data.
 * @param res The raw response received from TwitterAPI
 */
export function extractTweetRetweeters(res: any): { retweeters: User[], next: string } {
    var retweeters: User[] = [];
    var next: string = '';

    // If tweet does not exist
    if(isJSONEmpty(res['data']['retweeters_timeline'])) {
        throw new Error(Errors.TweetNotFound);
    }

    // Extracting raw retweeters list from response
    //@ts-ignore
    res = res['data']['retweeters_timeline']['timeline']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'];

    // Extracting cursor to next batch
    //@ts-ignore
    next = res.filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['value'];

    // Iterating over the raw list of likes
    for (var entry of res) {
        // Checking if entry is of type user
        if (entry['entryId'].indexOf('user') != -1) {
            // Adding the user to list of retweeters
            retweeters.push(new User().deserialize(entry['content']['itemContent']['user_results']['result']));
        }
    }

    return {
        retweeters: retweeters,
        next: next
    };
}

/**
 * @returns The raw list of replies to a target tweet from raw response data.
 * @param res The raw response received from TwitterAPI
 * @param tweetId The id of the tweet whose replies must be extracted
 */
export function extractTweetReplies(res: any, tweetId: string): { replies: Tweet[], next: string } {
    var replies: Tweet[] = [];
    var next: string = '';

    console.log(destructureRawData(res, Data.TweetReplies));

    // If tweet does not exist
    if(isJSONEmpty(res['data'])) {
        throw new Error(Errors.TweetNotFound);
    }

    // Extracting raw reply list
    //@ts-ignore
    res = res['data']['threaded_conversation_with_injections']['instructions'].filter(item => item['type'] === 'TimelineAddEntries')[0]['entries'].filter(item => item['entryId'].indexOf(tweetId) == -1);

    // Extracting cursor to next batch
    //@ts-ignore
    next = res.filter(item => item['entryId'].indexOf('cursor-bottom') != -1)[0]['content']['itemContent']['value'];

    // Iterating over raw list of tweets
    for (var entry of res) {
        var tweet: any;

        // Checking if entry is of type reply
        if (entry['entryId'].indexOf('conversationthread') != -1) {
            // Getting the tweet
            tweet = entry['content']['items'][0]['item']['itemContent']['tweet_results']['result'];

            // Checking if the reply is actually a reply to target tweet
            if (tweet['legacy']['in_reply_to_status_id_str'] === tweetId) {
                // Adding the reply to list of replies
                replies.push(new Tweet().deserialize(tweet));
            }
        }
    }

    return {
        replies: replies,
        next: next
    };
}