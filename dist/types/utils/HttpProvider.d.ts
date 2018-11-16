export default class HttpProvider {
    cache: any;
    hits: number;
    requests: any;
    private host;
    private timeout;
    private headers;
    private connected;
    private usecache;
    constructor(host?: any, options?: any);
    /**
     * Should be used to make async request
     *
     * @method useCache
     * @param {Object} payload
     * @param {Function} callback triggered on end with (err, result)
     */
    useCache(val: boolean): void;
    setCache(data: any): void;
    _prepareRequest(): XMLHttpRequest;
    /**
     * Should be used to make async request
     *
     * @method send
     * @param {Object} payload
     * @param {Function} callback triggered on end with (err, result)
     */
    send(payload: {}, callback: any): void;
    fromCache(payload: any): {
        jsonrpc: any;
        id: any;
        result: any;
    };
    fromCacheByKey(cacheKey: string, payload: any): {
        jsonrpc: any;
        id: any;
        result: any;
    };
    inCache(payload: any): boolean;
    inCacheByKey(cacheKey: string): boolean;
    toCache(payload: any, result: any): void;
    getCacheKey(payload: any): string;
}
