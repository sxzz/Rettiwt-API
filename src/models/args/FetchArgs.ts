// PACKAGES
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsNotEmpty,
	IsNumber,
	IsNumberString,
	IsObject,
	IsOptional,
	IsString,
	Max,
	validateSync,
} from 'class-validator';

// ENUMS
import { EResourceType } from '../../enums/Resource';

// MODELS
import { DataValidationError } from '../errors/DataValidationError';

/**
 * User set query parameters that are used to specify the data that is to be fetched.
 *
 * @public
 */
export class FetchArgs {
	/**
	 * The filter for searching.
	 *
	 * @remarks
	 * Required when resource type is {@link EResourceType.TWEET_SEARCH}
	 */
	@IsOptional()
	@IsNotEmpty({ groups: [EResourceType.TWEET_SEARCH] })
	@IsObject({ groups: [EResourceType.TWEET_SEARCH] })
	public filter?: TweetFilter;

	/**
	 * The id of the target resource.
	 *
	 * @remarks
	 * - Required for all resources except {@link EResourceType.TWEET_SEARCH}.
	 * - For {@link EResourceType.USER_DETAILS}, can be alphanumeric, while for others, is strictly numeric.
	 */
	@IsOptional()
	@IsNotEmpty({
		groups: [
			EResourceType.LIST_DETAILS,
			EResourceType.LIST_TWEETS,
			EResourceType.TWEET_DETAILS,
			EResourceType.TWEET_FAVORITERS,
			EResourceType.TWEET_RETWEETERS,
			EResourceType.USER_DETAILS_BY_USERNAME,
			EResourceType.USER_DETAILS_BY_ID,
			EResourceType.USER_FOLLOWERS,
			EResourceType.USER_FOLLOWING,
			EResourceType.USER_HIGHLIGHTS,
			EResourceType.USER_LIKES,
			EResourceType.USER_MEDIA,
			EResourceType.USER_SUBSCRIPTIONS,
			EResourceType.USER_TWEETS,
			EResourceType.USER_TWEETS_AND_REPLIES,
			EResourceType.SPACE_DETAILS_BY_ID,
			EResourceType.MEDIA_VIDEO_STREAM,
		],
	})
	@IsNumberString(undefined, {
		groups: [
			EResourceType.LIST_DETAILS,
			EResourceType.LIST_TWEETS,
			EResourceType.TWEET_DETAILS,
			EResourceType.TWEET_FAVORITERS,
			EResourceType.TWEET_RETWEETERS,
			EResourceType.USER_DETAILS_BY_ID,
			EResourceType.USER_FOLLOWERS,
			EResourceType.USER_FOLLOWING,
			EResourceType.USER_HIGHLIGHTS,
			EResourceType.USER_LIKES,
			EResourceType.USER_MEDIA,
			EResourceType.USER_SUBSCRIPTIONS,
			EResourceType.USER_TWEETS,
			EResourceType.USER_TWEETS_AND_REPLIES,
		],
	})
	@IsString({
		groups: [EResourceType.SPACE_DETAILS_BY_ID, EResourceType.MEDIA_VIDEO_STREAM],
	})
	public id?: string;

	/**
	 * The number of data items to fetch.
	 *
	 * @remarks
	 * - Works only for cursored resources.
	 * - Must be \<= 20 for {@link EResourceType.TWEET_SEARCH} and {@link EResourceType.USER_TWEETS}.
	 * - Must be \<= 100 for all other cursored resources.
	 *
	 * @defaultValue 20
	 */
	@IsOptional()
	@Max(100, {
		groups: [
			EResourceType.LIST_TWEETS,
			EResourceType.TWEET_FAVORITERS,
			EResourceType.TWEET_RETWEETERS,
			EResourceType.USER_FOLLOWERS,
			EResourceType.USER_FOLLOWING,
			EResourceType.USER_HIGHLIGHTS,
			EResourceType.USER_LIKES,
			EResourceType.USER_MEDIA,
			EResourceType.USER_SUBSCRIPTIONS,
		],
	})
	@Max(20, {
		groups: [EResourceType.TWEET_SEARCH, EResourceType.USER_TWEETS, EResourceType.USER_TWEETS_AND_REPLIES],
	})
	public count?: number;

	/**
	 * The cursor string to the batch of data to fetch.
	 *
	 * @remarks
	 * - May be used for cursored resources.
	 * - Has no effect for all other resources.
	 */
	@IsOptional()
	@IsString()
	public cursor?: string;

	/**
	 * @param resourceType - The type of resource that is requested.
	 * @param args - The additional user-defined arguments for fetching the resource.
	 */
	public constructor(resourceType: EResourceType, args: FetchArgs) {
		this.id = args.id;
		this.count = args.count ?? 20;
		this.cursor = args.cursor;

		/**
		 * Initializing filter only if resource type is TWEET_SEARCH
		 */
		if (resourceType == EResourceType.TWEET_SEARCH && args.filter) {
			this.filter = new TweetFilter(args.filter);
		}

		// Validating this object
		const validationResult = validateSync(this, { groups: [resourceType] });

		// If valiation error occured
		if (validationResult.length) {
			throw new DataValidationError(validationResult);
		}
	}
}

/**
 * The filter to be used for fetching tweets from Twitter.
 *
 * @public
 */
export class TweetFilter {
	/** The list of words to search. */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public includeWords?: string[];

	/** The exact phrase to search. */
	@IsOptional()
	@IsString()
	public includePhrase?: string;

	/** The optional words to search. */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public optionalWords?: string[];

	/** The list of words to exclude from search. */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public excludeWords?: string[];

	/**
	 * The list of hashtags to search.
	 *
	 * @remarks
	 * '#' must be excluded from the hashtag!
	 */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public hashtags?: string[];

	/**
	 * The list of usernames whose tweets are to be searched.
	 *
	 * @remarks
	 * '\@' must be excluded from the username!
	 */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public fromUsers?: string[];

	/**
	 * The list of username to whom the tweets to be searched, are adressed.
	 *
	 * @remarks
	 * '\@' must be excluded from the username!
	 */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public toUsers?: string[];

	/**
	 * The list of username mentioned in the tweets to search.
	 *
	 * @remarks
	 * '\@' must be excluded from the username!
	 */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public mentions?: string[];

	/** The minimum number of replies to search by. */
	@IsOptional()
	@IsNumber()
	public minReplies?: number;

	/** The minimun number of likes to search by. */
	@IsOptional()
	@IsNumber()
	public minLikes?: number;

	/** The minimum number of retweets to search by. */
	@IsOptional()
	@IsNumber()
	public minRetweets?: number;

	/** The language of the tweets to search. */
	@IsOptional()
	@IsString()
	public language?: string;

	/** The date starting from which tweets are to be searched. */
	@IsOptional()
	@IsDate()
	public startDate?: Date;

	/** The date upto which tweets are to be searched. */
	@IsOptional()
	@IsDate()
	public endDate?: Date;

	/** The id of the tweet, after which the tweets are to be searched. */
	@IsOptional()
	@IsNumberString()
	public sinceId?: string;

	/** The id of the tweet, before which the tweets are to be searched. */
	@IsOptional()
	@IsNumberString()
	public maxId?: string;

	/** The id of the tweet which is quoted in the tweets to search. */
	@IsOptional()
	@IsNumberString()
	public quoted?: string;

	/**
	 * Whether to fetch tweets that are links or not.
	 *
	 * @defaultValue true
	 */
	@IsOptional()
	@IsBoolean()
	public links?: boolean = true;

	/**
	 * Whether to fetch tweets that are replies or not.
	 *
	 * @defaultValue true
	 */
	@IsOptional()
	@IsBoolean()
	public replies?: boolean = true;

	/**
	 * @param filter - The filter to use for searching tweets.
	 */
	public constructor(filter: TweetFilter) {
		this.endDate = filter.endDate;
		this.excludeWords = filter.excludeWords;
		this.fromUsers = filter.fromUsers;
		this.hashtags = filter.hashtags;
		this.includePhrase = filter.includePhrase;
		this.language = filter.language;
		this.links = filter.links;
		this.replies = filter.replies;
		this.mentions = filter.mentions;
		this.quoted = filter.quoted;
		this.sinceId = filter.sinceId;
		this.maxId = filter.maxId;
		this.minLikes = filter.minLikes;
		this.minReplies = filter.minReplies;
		this.minRetweets = filter.minRetweets;
		this.optionalWords = filter.optionalWords;
		this.startDate = filter.startDate;
		this.toUsers = filter.toUsers;
		this.includeWords = filter.includeWords;

		// Validating this object
		const validationResult = validateSync(this);

		// If valiation error occured
		if (validationResult.length) {
			throw new DataValidationError(validationResult);
		}
	}

	/**
	 * @returns The string representation of 'this' object.
	 *
	 * @internal
	 */
	public toString(): string {
		return (
			[
				this.includeWords ? this.includeWords.join(' ') : '',
				this.includePhrase ? `"${this.includePhrase}"` : '',
				this.optionalWords ? `(${this.optionalWords.join(' OR ')})` : '',
				this.excludeWords ? `${this.excludeWords.map((word) => '-' + word).join(' ')}` : '',
				this.hashtags ? `(${this.hashtags.map((hashtag) => '#' + hashtag).join(' OR ')})` : '',
				this.fromUsers ? `(${this.fromUsers.map((user) => `from:${user}`).join(' OR ')})` : '',
				this.toUsers ? `(${this.toUsers.map((user) => `to:${user}`).join(' OR ')})` : '',
				this.mentions ? `(${this.mentions.map((mention) => '@' + mention).join(' OR ')})` : '',
				this.minReplies ? `min_replies:${this.minReplies}` : '',
				this.minLikes ? `min_faves:${this.minLikes}` : '',
				this.minRetweets ? `min_retweets:${this.minRetweets}` : '',
				this.language ? `lang:${this.language}` : '',
				this.startDate ? `since:${TweetFilter.dateToTwitterString(this.startDate)}` : '',
				this.endDate ? `until:${TweetFilter.dateToTwitterString(this.endDate)}` : '',
				this.sinceId ? `since_id:${this.sinceId}` : '',
				this.maxId ? `max_id:${this.maxId}` : '',
				this.quoted ? `quoted_tweet_id:${this.quoted}` : '',
			]
				.filter((item) => item !== '()' && item !== '')
				.join(' ') +
			(this.links == false ? ' -filter:links' : '') +
			(this.replies == false ? ' -filter:replies' : '')
		);
	}

	/**
	 * Convert Date object to Twitter string representation.
	 * eg - 2023-06-23_11:21:06_UTC
	 *
	 * @param date - The date object to convert.
	 * @returns The Twitter string representation of the date.
	 *
	 * @internal
	 */
	private static dateToTwitterString(date: Date): string {
		// Converting localized date to UTC date
		const utc = new Date(
			Date.UTC(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate(),
				date.getUTCHours(),
				date.getUTCMinutes(),
				date.getUTCSeconds(),
			),
		);

		/**
		 * To convert ISO 8601 date string to Twitter date string:
		 *
		 * - 'T' between date and time substring is replace with '_'.
		 * - Milliseconds substring is omitted.
		 * - '_UTC' is appended as suffix.
		 */
		return utc.toISOString().replace(/T/, '_').replace(/\..+/, '') + '_UTC';
	}
}
