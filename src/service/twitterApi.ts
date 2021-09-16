import TwitterApi from 'twitter-api-v2';
import _ from 'lodash';
import { isValidAddr } from '..';
import { twApiKey } from '../consts';

// Instanciate with desired auth type (here's Bearer v2 auth)
const twitterClient = new TwitterApi(twApiKey);
const crustTwitter = 'Crust Network'
export const twitterLinkPrefix = `https://twitter.com/`;

// Tell typescript it's a readonly app
const roClient = twitterClient.readOnly;
// `Requesting #CrustFreeStorage quota into {address} with {protionCode} on the #Crust Network via https://discord.gg/WQQHnyKCmn`
const twitterContentStart = `Requesting #CrustFreeStorage quota into`;
const twitterContentPromotionWith = `with`;
const twitterLinkSpliter = `/status/`

export interface TweetParseResult {
    status: boolean;
    result?: any;
    user?: string;
    address?: string;
    code?: string;
}

export async function parseTwitterByLink(twitterLink: string): Promise<TweetParseResult> {
    // like `zikunf/status/1437310853896753159`
    const userStatus = twitterLink.substr(twitterLinkPrefix.length);
    if (userStatus) {
        // like ['zikunf', '1437310853896753159']
        const userNameAndContentId = _.split(userStatus, twitterLinkSpliter);
        if (userNameAndContentId.length == 2) {
            const userInfo = await twitterUserInfo(userNameAndContentId[0].trim());
            if (userInfo.status) {
                const user = userNameAndContentId[0].trim();
                const t = await judgeTwitterIdentityByTwitterNum(userNameAndContentId[1].trim());
                if (t.status) {
                    return {
                        status: true,
                        user,
                        address: t.address,
                        code: t.code
                    }
                } else {
                    return {
                        status: false,
                        result: t.result
                    }
                }
            } else {
                return {
                    status: false,
                    result: userInfo.result
                }
            }
        } else {
            return {
                status: false,
                result: `💥  Bad request(invalid twitter), please double check your twitter link.`
            }
        }
    } else {
        return {
            status: false,
            result: `💥  Bad request(invalid twitter), please double check your twitter link.`
        }
    }
}

export async function singleTweet(tweetId: string) {
    // {
    //     "data": {
    //       "id": "1067094924124872705",
    //       "text": "Just getting started with Twitter APIs? Find out what you need in order to build an app. Watch this video! https://t.co/Hg8nkfoizN"
    //     }
    // }
    return roClient.v2.singleTweet(tweetId);
}

export async function judgeTwitterIdentityByTwitterNum (twNum: string) {
    const tweet = await singleTweet(twNum);
    console.log('tweet', tweet)
    const twText = tweet.data.text;
    try {
        const containFSSupertalk = _.includes(twText, `#CrustFreeStorage`);
        const containCrustSupertalk = _.includes(twText.replace(/\s+/g, "c"), '#CrustcNetwork');
        const containInviteLink = _.includes(twText, `https://t.co/8a2ZUOHq4T`);
        if (containFSSupertalk) {
            if (containCrustSupertalk) {
                if (containInviteLink) {
                    // like  {address} with {protionCode} on the #Crust Network via https://discord.gg/WQQHnyKCmn
                    const addrWithCodeStr = twText.substr(twitterContentStart.length);
                    // like [`cTMeMr6cC2xQwonTwpbSyKGv2VkvxEB836xr63vt8HsDNbF9q`, `protionCode on the #Crust Network via https://discord.gg/WQQHnyKCmn`]
                    const addressSplits = addrWithCodeStr.split(twitterContentPromotionWith);
                    if (addressSplits.length == 2) {
                        const address = addressSplits[0].trim();
                        if (isValidAddr(address)) {
                            // like ['code', 'via https://discord.gg/WQQHnyKCmn']
                            const codeSplit = addressSplits[1].split(`on the #Crust Network`);
                            const code = codeSplit[0].trim();
                            return {
                                status: true,
                                address,
                                code
                            }
                        } else {
                            return {
                                status: false,
                                result: `💥  Invalid Crust address`
                            }
                        }
                    } else {
                        return {
                            status: false,
                            result: `💥  Wrong content format`
                        }
                    }
                } else {
                    return {
                        status: false,
                        result: `💥  Wrong content format, missing invitation link (https://discord.gg/WQQHnyKCmn)`
                    }
                }
            } else {
                return {
                    status: false,
                    result: `💥  Wrong content format, missing #Crust Network`
                }
            }
        } else {
            return {
                status: false,
                result: `💥  Wrong content format, missing #CrustFreeStorage`
            }
        }
    } catch (error) {
        return {
            status: false,
            result: `💥  Bad request(invalid twitter), please double check your twitter link.`
        }
    }
}

export async function twitterUserInfo(twitterName: string) {
    try {  
        const userInfo = await roClient.v2.userByUsername(twitterName);
        console.log('userInfo', userInfo)
        const twitterId = userInfo.data.id;
        const isFollowed = await maybeFollowed(twitterId);
        console.log('isFollowed', isFollowed)
        if (isFollowed) {
            return {
                status: true,
                result: twitterId
            }
        } else {
            return {
                status: false,
                result: `💥  Not following Crust Network`
            }
        }
    } catch (error) {
        console.log('get twitterUserInfo', error)
        return {
            status: false,
            result: `💥  Illegal user`
        }
    }
}

export async function maybeFollowed(userId: string) {
    try {
        const currentUserFollowing = await roClient.v2.following(userId);
        const index = _.findIndex(currentUserFollowing.data, e => e.name == crustTwitter);
        if (index >= 0 ) {
            return true;
        } else {
            let nextToken = currentUserFollowing.meta.next_token;
            while (nextToken) {
                const pageFollowing = await roClient.v2.following(userId, { pagination_token: nextToken });
                const index = _.findIndex(pageFollowing.data, e => e.name == crustTwitter);
                if (index >= 0 ) {
                    return true;
                }
                nextToken = pageFollowing.meta.next_token;
            }
        }      
    } catch (error) {
        console.log('error', error)
        return false;
    }

    return false;
}