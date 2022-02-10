// This file contains the serivce that handles fetching of various tweets and other similar content from official API

// CUSTOM LIBS

import { FetcherService } from "../FetcherService";

import {
    Error,
    Response
} from '../../schema/types/HTTP'

import {
    TweetFilter,
    Tweet
} from "../../schema/types/TweetData";

import {
    User
} from "../../schema/types/UserAccountData";

import {
    userTweetsUrl,
    filteredTweetsUrl,
    tweetRepliesUrl,
    tweetLikesUrl,
    tweetRetweetUrl
} from '../helper/Requests';

export class TweetService extends FetcherService {
    // MEMBER METHODS
    constructor(
        authToken: string,
        csrfToken: string,
        cookie: string
    ) {
        super(authToken, csrfToken, cookie);
    }

    // TODO: Make this method also fetch the tweets as well as the replies made by the user
    // TODO: Make this method filter out retweets made by the user
    // Method to fetch all tweets and replies made by a user
    getTweets(
        userId: number,
        count: number,
        cursor: string,
    ): Promise<Response<{ tweets: Tweet[]; next: string }>> {
        return this.fetchData(userTweetsUrl(userId, count, cursor))
            .then(res => {
                var tweets: Tweet[] = [];
                var next: string = '';
                
                var data = res['data']['user']['result']['timeline']['timeline']['instructions'][0]['entries'];
                next = data[data.length - 1]['content']['value'];

                //@ts-ignore
                for (var entry of data) {
                    // If the entry is a tweet
                    if (entry['entryId'].indexOf("tweet") != -1) {
                        // Extracting the tweet
                        const tweet = entry['content']['itemContent']['tweet_results']['result'];

                        // Adding the tweet to tweet list
                        tweets.push(new Tweet().deserialize({
                            'rest_id': tweet['rest_id'],
                            ...tweet['legacy']
                        }));
                    }
                    // If the entry is a retweet
                    else if (entry['entryId'].indexOf("homeConversation") != -1) {
                        // Iterating through sub entries
                        for (var entry of entry['content']['items']) {
                            // Extracting the tweet
                            const tweet = entry['item']['itemContent']['tweet_results']['result'];

                            // Adding the tweet to tweet list
                            tweets.push(new Tweet().deserialize({
                                'rest_id': tweet['rest_id'],
                                ...tweet['legacy']
                            }));
                        }
                    }
                }

                return new Response<{ tweets: Tweet[], next: string }>(
                    true,
                    new Error(null),
                    { tweets: tweets, next: next }
                );
            })
            // If error parsing json
            .catch(err => {
                return new Response<{ tweets: Tweet[], next: string }>(
                    false,
                    new Error(err),
                    { tweets: [], next: '' }
                );
            })
    }

    // FIXME: This feature does not work accurately and returns recurrent data most of the times
    // Method to fetch tweets filtered by the supplied filter
    getFilteredTweets(
        filter: TweetFilter,
        cursor: string
    ): Promise<Response<{ tweets: Tweet[], next: string }>> {
        return this.fetchData(filteredTweetsUrl(filter, cursor))
            .then(res => {
                var tweets: Tweet[] = [];
                var next: '';

                // Extracting tweets list and cursor to next batch from the response
                // If not a first batch
                if (res['timeline']['instructions'][2]) {
                    next = res['timeline']['instructions'][2]['replaceEntry']['entry']['content']['operation']['cursor']['value'];
                }
                // If first batch
                else {
                    next = res['timeline']['instructions'][0]['addEntries']['entries'].at(-1)['content']['operation']['cursor']['value'];
                }

                // Getting the raw list of tweets from response
                res = res['globalObjects']['tweets'];

                // Iterating through the json array of tweets
                for (var key of Object.keys(res)) {
                    // Adding the tweets to the Tweet[] list
                    tweets.push(new Tweet().deserialize({
                        'rest_id': res[key]['id_str'],
                        ...res[key]
                    }));
                }

                return new Response<{ tweets: Tweet[], next: string }>(
                    true,
                    new Error(null),
                    { tweets: tweets, next: next }
                );
            })
            // If error parsing json
            .catch(err => {
                return new Response<{ tweets: Tweet[], next: string }>(
                    false,
                    new Error(err),
                    { tweets: [], next: '' }
                );
            });
    }

    // Method to fetch tweet likes using tweet id
    getTweetLikers(
        tweetId: number,
        count: number,
        cursor: string
    ): Promise<Response<{ likers: User[], next: string }>> {
        return this.fetchData(tweetLikesUrl(tweetId, count, cursor))
            .then(res => {
                var likers: User[] = [];
                var next: string = '';

                // Extracting raw likes list from response
                res = res['data']['favoriters_timeline']['timeline']['instructions'][0]['entries'];

                // Iterating over the raw list of likes
                for (var entry of res) {
                    // Checking if entry is of type user
                    if (entry['entryId'].indexOf('user') != -1) {
                        // Extracting user from the entry
                        var user = entry['content']['itemContent']['user_results']['result'];

                        // Inserting user into list of likes
                        likers.push(new User().deserialize(user));
                    }
                    // If entry is of type bottom cursor
                    else if (entry['entryId'].indexOf('cursor-bottom') != -1) {
                        next = entry['content']['value'];
                    }
                }

                return new Response<{ likers: User[], next: string }>(
                    true,
                    new Error(null),
                    { likers: likers, next: next }
                );
            })
            // If error parsing json
            .catch(err => {
                return new Response<{ likers: User[], next: string }>(
                    false,
                    new Error(err),
                    { likers: [], next: '' }
                );
            });
    }

    // Method to fetch tweet retweeters using tweet id
    getTweetRetweeters(
        tweetId: number,
        count: number,
        cursor: string
    ): Promise<Response<{ retweeters: User[], next: string }>> {
        return this.fetchData(tweetRetweetUrl(tweetId, count, cursor))
            .then(res => {
                var retweeters: User[] = [];
                var next: string = '';

                // Extracting raw likes list from response
                res = res['data']['retweeters_timeline']['timeline']['instructions'][0]['entries']

                // Iterating over the raw list of likes
                for (var entry of res) {
                    // Checking if entry is of type user
                    if (entry['entryId'].indexOf('user') != -1) {
                        // Extracting user from the entry
                        var user = entry['content']['itemContent']['user_results']['result'];

                        // Inserting user into list of likes
                        retweeters.push(new User().deserialize(user));
                    }
                    // If entry is of type bottom cursor
                    else if (entry['entryId'].indexOf('cursor-bottom') != -1) {
                        next = entry['content']['value'];
                    }
                }

                return new Response<{ retweeters: User[], next: string }>(
                    true,
                    new Error(null),
                    { retweeters: retweeters, next: next }
                );
            })
            // If error parsing json
            .catch(err => {
                return new Response<{ retweeters: User[], next: string }>(
                    false,
                    new Error(err),
                    { retweeters: [], next: '' }
                );
            });
    }

    // Method to fetch tweet replies using tweet id
    getTweetReplies(
        tweetId: number,
        cursor: string
    ): Promise<Response<{ replies: Tweet[], next: string }>> {
        return this.fetchData(tweetRepliesUrl(tweetId, cursor))
            .then(res => {
                var replies: Tweet[] = [];
                var next = '';

                // Extracting raw tweet data from response
                res = res['data']['threaded_conversation_with_injections']['instructions'][0]['entries']

                for (var entry of res) {
                    // Checking if entry is of type reply
                    if (entry['entryId'].indexOf('conversationthread') != -1) {
                        var reply = entry['content']['items'][0]['item']['itemContent']['tweet_results']['result'];

                        replies.push(new Tweet().deserialize({
                            rest_id: reply['rest_id'],
                            ...reply['legacy']
                        }));
                    }
                    // If entry is of type bottom cursor
                    else if (entry['entryId'].indexOf('cursor-bottom') != -1) {
                        next = entry['content']['itemContent']['value'];
                    }
                }

                return new Response<{ replies: Tweet[], next: string }>(
                    true,
                    new Error(null),
                    { replies: replies, next: next }
                );
            })
            // If error parsing json
            .catch(err => {
                return new Response<{ replies: Tweet[], next: string }>(
                    false,
                    new Error(err),
                    { replies: [], next: '' }
                );
            });
    }
}