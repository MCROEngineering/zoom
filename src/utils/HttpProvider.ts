/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        HttpProvider
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
 based on https://github.com/ethereum/web3.js/blob/develop/lib/web3/httpprovider.js
*/

import CryptoJS from "crypto-js";
const errors = require('web3-core-helpers').errors;
const XHR2 = require('xhr2-cookies').XMLHttpRequest; // jshint ignore: line

export default class HttpProvider {

    public cache: any;
    public hits: number = 0;
    public requests: any = [];
    private host: string;
    private timeout: number;
    private headers: any;
    private connected: boolean = false;
    private usecache: boolean = false;

    constructor(host?: any, options?: any) {
        options = options || {};
        this.host = host || 'http://localhost:8545';
        this.timeout = options.timeout || 0;
        this.headers = options.headers;
        this.cache = {};
    }

    /**
     * Create and return a new XMLHttpRequest
     *
     * @returns {XMLHttpRequest} 
     */
    public _prepareRequest(): XMLHttpRequest {
        const request = new XHR2();

        request.open('POST', this.host, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.timeout = this.timeout && this.timeout !== 1 ? this.timeout : 0;
        request.withCredentials = true;

        if (this.headers) {
            this.headers.forEach((header: any) => {
                request.setRequestHeader(header.name, header.value);
            });
        }

        return request;
    }

    /**
     * Should be used to make async request
     *
     * @method send
     * @param {Object} payload
     * @param {Function} callback triggered on end with (err, result)
     */
    public send(payload: {}, callback: any): void {

        this.requests.push(JSON.stringify(payload));

        this.hits++;
        if (this.usecache === true) {
            const cacheKey = this.getCacheKey(payload);
            if (this.inCacheByKey(cacheKey)) {
                callback(null, this.fromCacheByKey(cacheKey, payload));
                return;
            } else {
                /*
                if (payload[0] === undefined ) {
                    console.log("not in cache:", JSON.stringify(payload));
                }
                */
            }
        }

        const othis = this;
        const request = this._prepareRequest();

        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.timeout !== 1) {
                let result = request.responseText;
                let error = null;

                try {
                    result = JSON.parse(result);
                } catch (e) {
                    error = errors.InvalidResponse(request.responseText);
                }

                if (this.usecache === true) {
                    this.toCache(payload, result);
                }
                othis.connected = true;
                callback(error, result);
            }
        };

        request.ontimeout = () => {
            othis.connected = false;
            callback(errors.ConnectionTimeout(this.timeout));
        };

        try {
            request.send(JSON.stringify(payload));
        } catch (error) {
            this.connected = false;
            callback(errors.InvalidConnection(this.host));
        }
    }

    /**
     * Enable request caching
     *
     * @param boolean
     */
    public enableCache(setting: boolean): void {
        this.usecache = setting;
    }

    /**
     * Set caching object reference
     *
     * @param {object}
     */
    public setCache(data: any): void {
        this.cache = data;
    }

    /**
     * Retrieve data from cache by payload
     *
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    public fromCache(payload: any): {} {
        const cacheKey = this.getCacheKey(payload);
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    }

    /**
     * Retrieve data from cache by cache key
     *
     * @param cache key
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    public fromCacheByKey(cacheKey: string, payload: any): {} {
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    }

    /**
     * Check if payload has a cached result stored
     *
     * @param {payload} object
     * @returns boolean
     */
    public inCache(payload: any): boolean {
        const cacheKey = this.getCacheKey(payload);
        console.log("inCache", cacheKey, JSON.stringify(payload) );
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    }

    /**
     * Check if cacheKey has a cached result stored
     *
     * @param cache key
     * @returns boolean
     */
    public inCacheByKey(cacheKey: string): boolean {
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    }

    /**
     * Save result in cache
     *
     * @param {payload} rpc call
     * @param {result} rpc result
     */
    public toCache(payload: any, result: any): void {
        this.cache[this.getCacheKey(payload)] = result.result;
    }

    /**
     * Get cache key for payload - rpc call
     *
     * @param {payload} rpc call
     * @returns cache key string
     */
    public getCacheKey(payload: any): string {
        if (payload.length > 1) {
            const key = "batch_" + CryptoJS.MD5(JSON.stringify(payload));
            return key;
        }
        else {
            if( payload.method === "eth_call" ) {
                /*
                return crypto_js_1.MD5(
                    payload.params[0].to.toString().toLowerCase() 
                    + payload.params[0].data
                ).toString();
                */

                return payload.params[0].to + "_" + payload.params[0].data;
            }
            return "";
        }
    }

}
