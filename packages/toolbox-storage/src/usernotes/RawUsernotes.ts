// type imports for doc links
import pako from 'pako';

import {_compressBlob, _decompressBlob} from '#blobInternals';

/**
 * The latest usernotes schema version that this library can handle. If a
 * usernotes page reports a schema version higher than this number, it can't be
 * processed with this version of the library.
 */
export const LATEST_KNOWN_USERNOTES_SCHEMA = 6;

/**
 * The earliest usernotes schema version that this library can handle. If a
 * usernotes page reports a schema version lower than this number, it can't be
 * processed with this version of the library.
 */
export const EARLIEST_KNOWN_USERNOTES_SCHEMA = 4;

/** Raw data for a single usernote */
export interface RawUsernotesNote {
	/** Timestamp (seconds since epoch) */
	t: number;
	/** Note text */
	n: string;
	/** Index in constants.users of moderator who left this note */
	m: number;
	/** Index in constants.warnings of this note's type's key */
	w?: number;
	/** Permalink of note context, in shortened format */
	l?: string;
}

/**
 * A zlib-compressed, base64-encoded representation of an object. Retrieve the
 * data by using {@linkcode decompressBlob}.
 */
export type RawUsernotesBlob<T> = string & {_contents?: T};

/** Raw data for the object of all usernotes */
export interface RawUsernotesUsers {
	/** The username of a user */
	[name: string]: {
		/** A list of allnotes left on that user */
		ns: RawUsernotesNote[];
	};
}

/** Constant data referenced by usernotes */
export interface RawUsernotesConstants {
	/** A list of all mods who have added notes */
	users: (string | null)[];
	/** A list of all the keys of note types that have been used */
	warnings: (string | null)[];
}

/**
 * Raw data stored as JSON on the `usernotes` wiki page.
 *
 * Note that while the library supports upgrading older schemas to the current
 * one (via {@linkcode migrateUsernotesToLatestSchema}), this type will only
 * describe the latest known schema version. If you are manually reading data
 * from the wiki without passing it through the migration function, and you read
 * a `ver` value different than {@linkcode LATEST_KNOWN_USERNOTES_SCHEMA}, this
 * type will not describe that data.
 */
export interface RawUsernotes {
	/** The version number of the usernotes schema this data conforms to */
	ver: 6;
	/** Constant data referenced by usernotes */
	constants: RawUsernotesConstants;
	/** A blob that, when decompressed, yields a {@linkcode RawUsernotesUsers} object */
	blob: RawUsernotesBlob<RawUsernotesUsers>;
}

/**
 * Attempts to shorten a link into the Toolbox permalink format for usernotes.
 * This format is described here:
 * {@link https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Subreddit-Wikis%3A-usernotes#link-string-formats}
 * @param permalink The link to shorten
 * @returns A shortened link string, or the original URL if the link
 * doesn't match any shortening format known to Toolbox.
 */
export function squashPermalink (permalink: string): string {
	let match: RegExpMatchArray | null;
	if (
		(match = permalink.match(
			/(?:\/comments|^https?:\/\/redd\.it)\/([a-z0-9]+)(?:\/[^/]*(?:\/([a-z0-9]+)?)?)?/,
		))
	) {
		// Submission pages
		let squashed = `l,${match[1]}`;
		if (match[2]) {
			// Add context for specific comments
			squashed += `,${match[2]}`;
		}
		return squashed;
	} else if ((match = permalink.match(/\/messages\/(\w+)/))) {
		// Old modmail pages
		return `m,${match[1]}`;
	} else if (permalink.startsWith('https://mod.reddit.com')) {
		// New modmail pages
		return permalink;
	}
	// If nothing else, return the original permalink
	return permalink;
}

/**
 * Expands a shortened link string from Toolbox usernotes into a full permalink.
 * This format is described here:
 * {@link https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Subreddit-Wikis%3A-usernotes#link-string-formats}
 * @param shortenedLink The shortened link string to expand
 * @returns The expanded, full permalink
 */
export function expandPermalink (shortenedLink: string): string {
	if (shortenedLink.startsWith('l,')) {
		// Expand to a submission or comment permalink
		return `https://www.reddit.com/comments/${
			shortenedLink.substr(2).split(',').join('/_/')
		}`;
	} else if (shortenedLink.startsWith('m,')) {
		// Expand to a message permalink
		return `https://www.reddit.com/message/messages/${shortenedLink.substr(2)}`;
	}
	return shortenedLink;
}

/**
 * Compresses a JSON value into a zlib-compressed, base64-encoded blob string.
 * This format is described here:
 * {@link https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Subreddit-Wikis:-usernotes#working-with-the-blob}
 * @param value The object or value to compress
 * @returns The generated blob.
 */
export const compressBlob = <T>(value: T): RawUsernotesBlob<T> =>
	_compressBlob(value);

/**
 * Decompresses a {@linkcode RawUsernotesBlob} string into the JSON value it
 * encodes. This format is described here:
 * {@link https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Subreddit-Wikis:-usernotes#working-with-the-blob}
 * @param blob The blob to decompress
 * @returns The original JSON value.
 */
export const decompressBlob = <T>(blob: RawUsernotesBlob<T>): T =>
	_decompressBlob(blob);

/**
 * Checks the schema version of raw usernotes data and attempts to update it to
 * the latest known schema version if it's out of date. Throws an error if the
 * data's current schema version is too old or new to handle.
 * @param data The usernotes data object read from the wiki, as an object (i.e.
 * you should parse the page contents as JSON to pass into this function)
 * @returns Data object updated to latest schema version
 */
export function migrateUsernotesToLatestSchema (data: any): RawUsernotes {
	if (data.ver < EARLIEST_KNOWN_USERNOTES_SCHEMA) {
		throw new TypeError(
			`Unknown schema version ${data.ver} (earliest known version is ${EARLIEST_KNOWN_USERNOTES_SCHEMA})`,
		);
	}
	if (data.ver > LATEST_KNOWN_USERNOTES_SCHEMA) {
		throw new TypeError(
			`Unknown schema version ${data.ver} (latest known version is ${LATEST_KNOWN_USERNOTES_SCHEMA})`,
		);
	}

	// eslint-disable-next-line default-case
	switch (data.ver) {
		case 4: // Migrate from 4 to 5
			// Timestamps need to be converted from milliseconds to seconds
			for (const user of Object.values(data.users as RawUsernotesUsers)) {
				for (const note of user.ns) {
					if (note.t) {
						note.t /= 1000;
					}
				}
			}
			// fallthrough to immediately bump to next version
		case 5: // Migrate from 5 to 6
			// Users are now stored as a blob rather than a plain object
			data.blob = compressBlob(data.users);
			delete data.users;
	}

	return data as RawUsernotes;
}
