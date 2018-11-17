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
     * Create and return a new XMLHttpRequest
     *
     * @returns {XMLHttpRequest}
     */
    _prepareRequest(): XMLHttpRequest;
    /**
     * Should be used to make async request
     *
     * @method send
     * @param {Object} payload
     * @param {Function} callback triggered on end with (err, result)
     */
    send(payload: {}, callback: any): void;
    /**
     * Enable request caching
     *
     * @param boolean
     */
    enableCache(setting: boolean): void;
    /**
     * Set caching object reference
     *
     * @param {object}
     */
    setCache(data: any): void;
    /**
     * Retrieve data from cache by payload
     *
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    fromCache(payload: any): {};
    /**
     * Retrieve data from cache by cache key
     *
     * @param cache key
     * @param {payload} object
     * @returns {result} cached rpc result
     */
    fromCacheByKey(cacheKey: string, payload: any): {};
    /**
     * Check if payload has a cached result stored
     *
     * @param {payload} object
     * @returns boolean
     */
    inCache(payload: any): boolean;
    /**
     * Check if cacheKey has a cached result stored
     *
     * @param cache key
     * @returns boolean
     */
    inCacheByKey(cacheKey: string): boolean;
    /**
     * Save result in cache
     *
     * @param {payload} rpc call
     * @param {result} rpc result
     */
    toCache(payload: any, result: any): void;
    /**
     * Get cache key for payload - rpc call
     *
     * @param {payload} rpc call
     * @returns cache key string
     */
    getCacheKey(payload: any): string;
}
