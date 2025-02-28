import test from 'ava';

import {
	expandPermalink,
	migrateUsernotesToLatestSchema,
	squashPermalink,
} from './RawUsernotes.js';

test('squashPermalink', t => {
	for (
		const [arg, expected] of Object.entries({
			// Comment links -> l,POSTID,COMMENTID
			'https://www.reddit.com/r/subreddit/comments/123abc/some_link_slug/456def':
				'l,123abc,456def',
			'https://www.reddit.com/r/subreddit/comments/123abc/some_link_slug/456def/?trailing#garbage':
				'l,123abc,456def',
			'https://www.reddit.com/comments/123abc/some_link_slug/456def':
				'l,123abc,456def',
			'https://www.reddit.com/comments/123abc/some_link_slug/456def/?trailing#garbage':
				'l,123abc,456def',
			'https://new.reddit.com/r/subreddit/comments/123abc/some_link_slug/456def':
				'l,123abc,456def',
			'https://new.reddit.com/r/subreddit/comments/123abc/some_link_slug/456def/?trailing#garbage':
				'l,123abc,456def',
			'https://new.reddit.com/comments/123abc/some_link_slug/456def':
				'l,123abc,456def',
			'https://new.reddit.com/comments/123abc/some_link_slug/456def/?trailing#garbage':
				'l,123abc,456def',
			'https://old.reddit.com/r/subreddit/comments/123abc/some_link_slug/456def':
				'l,123abc,456def',
			'https://old.reddit.com/r/subreddit/comments/123abc/some_link_slug/456def/?trailing#garbage':
				'l,123abc,456def',
			'https://old.reddit.com/comments/123abc/some_link_slug/456def':
				'l,123abc,456def',
			'https://old.reddit.com/comments/123abc/some_link_slug/456def/?trailing#garbage':
				'l,123abc,456def',
			// Submission links -> l,POSTID
			'https://www.reddit.com/r/subreddit/comments/123abc': 'l,123abc',
			'https://www.reddit.com/r/subreddit/comments/123abc/some_link_slug/?trailing#garbage':
				'l,123abc',
			'https://www.reddit.com/comments/123abc': 'l,123abc',
			'https://www.reddit.com/comments/123abc/some_link_slug/?trailing#garbage':
				'l,123abc',
			'https://new.reddit.com/r/subreddit/comments/123abc': 'l,123abc',
			'https://new.reddit.com/r/subreddit/comments/123abc/some_link_slug/?trailing#garbage':
				'l,123abc',
			'https://new.reddit.com/comments/123abc': 'l,123abc',
			'https://new.reddit.com/comments/123abc/some_link_slug/?trailing#garbage':
				'l,123abc',
			'https://old.reddit.com/r/subreddit/comments/123abc': 'l,123abc',
			'https://old.reddit.com/r/subreddit/comments/123abc/some_link_slug/?trailing#garbage':
				'l,123abc',
			'https://old.reddit.com/comments/123abc': 'l,123abc',
			'https://old.reddit.com/comments/123abc/some_link_slug/?trailing#garbage':
				'l,123abc',
			'https://redd.it/123abc': 'l,123abc',
			'https://redd.it/123abc/?trailing#garbage': 'l,123abc',
			// Old modmail links -> m,MESSAGEID
			'https://www.reddit.com/r/subreddit/message/messages/123abc': 'm,123abc',
			'https://www.reddit.com/r/subreddit/message/messages/123abc/?trailing#garbage':
				'm,123abc',
			'https://www.reddit.com/message/messages/123abc': 'm,123abc',
			'https://www.reddit.com/message/messages/123abc/?trailing#garbage':
				'm,123abc',
			'https://new.reddit.com/r/subreddit/message/messages/123abc': 'm,123abc',
			'https://new.reddit.com/r/subreddit/message/messages/123abc/?trailing#garbage':
				'm,123abc',
			'https://new.reddit.com/message/messages/123abc': 'm,123abc',
			'https://new.reddit.com/message/messages/123abc/?trailing#garbage':
				'm,123abc',
			'https://old.reddit.com/r/subreddit/message/messages/123abc': 'm,123abc',
			'https://old.reddit.com/r/subreddit/message/messages/123abc/?trailing#garbage':
				'm,123abc',
			'https://old.reddit.com/message/messages/123abc': 'm,123abc',
			'https://old.reddit.com/message/messages/123abc/?trailing#garbage':
				'm,123abc',
			// Everything else is passed through as-is, including new modmail
			'https://mod.reddit.com/mail/all/123abc':
				'https://mod.reddit.com/mail/all/123abc',
			'literally anything else': 'literally anything else',
		})
	) {
		t.is(squashPermalink(arg), expected);
	}
});

test('expandPermalink', t => {
	for (
		const [arg, expected] of Object.entries({
			// Squashed submission links
			'l,123abc': 'https://www.reddit.com/comments/123abc',
			// Squashed comment links
			'l,123abc,456def': 'https://www.reddit.com/comments/123abc/_/456def',
			// Squashed old modmail links
			'm,123abc': 'https://www.reddit.com/message/messages/123abc',
			// Everything else is passed through as-is
			'https://www.reddit.com/r/subreddit/comments/123abc/':
				'https://www.reddit.com/r/subreddit/comments/123abc/',
			'https://mod.reddit.com/mail/all/123abc':
				'https://mod.reddit.com/mail/all/123abc',
			'literally anything else': 'literally anything else',
		})
	) {
		t.is(expandPermalink(arg), expected);
	}
});

test.todo('migrateUsernotesSchema');
