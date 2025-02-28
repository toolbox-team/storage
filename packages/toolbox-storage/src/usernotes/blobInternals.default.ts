// Generic implementation of RawUsernotesBlob compression/decompression

import 'core-js/actual/typed-array/from-base64';
declare global {
	interface Uint8ArrayConstructor {
		fromBase64(
			string: string,
			options?: {
				alphabet?: 'base64' | 'base64url';
				lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial';
			},
		): Uint8Array;
	}
}

import 'core-js/actual/typed-array/to-base64';
declare global {
	interface Uint8Array {
		toBase64(
			options?: {alphabet?: 'base64' | 'base64url'; omitPadding?: boolean},
		): string;
	}
}

import {deflate, inflate} from 'pako';
import {type RawUsernotesBlob} from './RawUsernotes.js';

export const _compressBlob = <T>(value: T): RawUsernotesBlob<T> =>
	deflate(JSON.stringify(value)).toBase64();

export const _decompressBlob = <T>(blob: RawUsernotesBlob<T>): T =>
	JSON.parse(inflate(Uint8Array.fromBase64(blob), {to: 'string'}));
