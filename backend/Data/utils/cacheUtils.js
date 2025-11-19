const {client} = require('../config/redisConfig');

class CacheUtils{
    static generateCacheKey(prefix,method,params){
        const keyParts = [prefix,method];
        Object.keys(params).forEach((key)=>{
            if(params[key] !== undefined && params[key] !== null){
                keyParts.push(`${key}:${params[key]}`)
            }
        })
        return keyParts.join(':');
    }
    static async setCache(key,ttl,data)
    {
        try
        {
            await client.setEx(key,ttl,JSON.stringify(data));
            return true;
        }
        catch(err){
            console.error('Redis set error:', err);
            return false;
        }
    }
    static async getCache(key){
        try
        {
            const cacheData = await client.get(key);
            return JSON.parse(cacheData);
        }
        catch(err){
            console.error('Redis get error:', err);
            return null;
        }
    }
    static async invalidateCache(prefix){
        try
        {
            const keys = await client.keys(`${prefix}:*`);
            if(keys != null)
            {
                await client.del(keys);
            }
        }
        catch(err){
            console.error('Redis invalidation error:', err);
            return false;
        }
    }
}
module.exports = CacheUtils;