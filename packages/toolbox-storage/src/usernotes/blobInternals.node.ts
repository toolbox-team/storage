// Node-specific implementation of RawUsernotesBlob compression/decompression,
// which doesn't use any dependencies

import {deflateSync, inflateSync} from 'node:zlib';
import {type RawUsernotesBlob} from './RawUsernotes.js';

export const _compressBlob = <T>(value: T): RawUsernotesBlob<T> => {
	const input = Buffer.from(JSON.stringify(value), 'utf-8');
	return deflateSync(input).toString('base64');
};

export const _decompressBlob = <T>(blob: RawUsernotesBlob<T>): T => {
	const input = Buffer.from(blob, 'base64');
	return JSON.parse(inflateSync(input).toString('utf-8'));
};
