// import { HttpProvider } from "../node_modules/web3/types";
import CryptoJS from "crypto-js";
const errors = require('web3-core-helpers').errors;
const XHR2 = require('xhr2-cookies').XMLHttpRequest; // jshint ignore: line

class HttpProviderCache {

    public cache: any;
    public hits: number = 0;
    public requests: any = [];
    private host: string;
    private timeout: number;
    private headers: any;
    private connected: boolean = false;
    private usecache: boolean = false;
    private savetocache: boolean = false;

    constructor(host?: any, options?: any) {
        options = options || {};
        this.host = host || 'http://localhost:8545';
        this.timeout = options.timeout || 0;
        this.headers = options.headers;
        this.cache = {};
    }

    public useCache(val: boolean) {
        this.usecache = val;
    }

    public setCache(data: any) {
        this.cache = data;
    }

    public _prepareRequest() {
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
    public send(payload: any, callback: any) {

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

                if (this.usecache === true || this.savetocache === true) {
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

    public fromCache(payload: any) {
        const cacheKey = this.getCacheKey(payload);
        console.log("fromCache", cacheKey, JSON.stringify(payload), JSON.stringify( this.cache[cacheKey] ) );
        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    }

    public fromCacheByKey(cacheKey: string, payload: any) {
        console.log("fromCacheByKey", cacheKey, JSON.stringify(payload), JSON.stringify( this.cache[cacheKey] ) );

        return {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: this.cache[cacheKey],
        };
    }

    public inCache(payload: any) {
        const cacheKey = this.getCacheKey(payload);
        console.log("inCache", cacheKey, JSON.stringify(payload) );
        if (this.cache.hasOwnProperty(cacheKey)) {
            return true;
        }
        return false;
    }

    public inCacheByKey(cacheKey: string) {
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
        let key;
        if (payload.length > 1) {
            key = "batch_" + CryptoJS.MD5(JSON.stringify(payload));
        }
        else {
            if( payload.method === "eth_call" ) {
                /*
                return crypto_js_1.MD5(
                    payload.params[0].to.toString().toLowerCase() 
                    + payload.params[0].data
                ).toString();
                */

               key = payload.params[0].to + "_" + payload.params[0].data;
            }
        }
        return key;
    }

    public saveToCache(val: boolean) {
        this.savetocache = val;
    }
}

export default HttpProviderCache;
