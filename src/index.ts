import pRetry from 'p-retry';
import { logger } from '@polkadot/util';
import { judgeGithubIdentityByIssueNum } from './service/githubApi';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { chainAddr, token, channel, githubRepoName, dbEndpoint } from './consts';
import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { timeout } from 'promise-timeout';
const { Client, Intents } = require('discord.js');
import { githubUserName } from './consts';
import DB from './db/index';
import { githubHandler, promotionCodeHandler } from './service/handler';
import _ from 'lodash';
import { parseTwitterByLink, twitterLinkPrefix } from './service/twitterApi';
import { IPromotionApplicant } from './db/models/promotionApplicant.model';
const db = new DB(dbEndpoint as string);

const l = logger('main');

const keyring = new Keyring();

export const isValidAddr = (addr: string) => {
    try {
        keyring.decodeAddress(addr);
        return true;
    } catch (error) {
        return false;
    }
}
const apiLocker = {};

const bot = () => {
    const provider = new WsProvider(chainAddr);
    ApiPromise.create({
        provider,
        typesBundle: typesBundleForPolkadot,
    }).then(async (api) => {
        const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], restRequestTimeout: 60 * 6000 });
        client.on('ready', () => {
            l.log(`Logged in as ${client.user.tag}!`);
        });

        client.on('error', console.error);

        client.on('messageCreate', async (msg: { channelId: any; content: any; author: { id: any; }; reply: (arg0: string) => void; }) => {
            const channelId = msg.channelId;
            l.log(`channelId: ${channelId}, ${msg.content}`)
            if (channel == channelId) {
                const content = msg.content;
                //   const authorId = msg.author.id;
                const urlPrefix = `https://github.com/${githubUserName}/${githubRepoName}/issues/`;
                if (content.startsWith(urlPrefix)) {
                    const issue = content.substr(urlPrefix.length);
                    if (_.isNumber(Number(issue))) {       
                        const parseResult = await judgeGithubIdentityByIssueNum(Number(issue));
                        if (parseResult.status) {
                            const applyResult = await handleWithLock(apiLocker, 'github_apply', async () => {
                                if (parseResult.githubInfo) {
                                    return await githubHandler(api, parseResult.githubInfo, db);
                                }
                            }, {
                                value: "🤯 Faucet is busy, please try it later."
                            });
                            msg.reply(applyResult.value);
                        } else {
                            msg.reply(parseResult.result);
                        }
                    } else {
                        msg.reply('💥 Bad request(issue not exist), please double check your issue link.');
                    }
                }
                if (content.startsWith(twitterLinkPrefix)) {
                    const twitterParseResult = await parseTwitterByLink(content);
                    if (twitterParseResult.status) {
                        const applyResult = await handleWithLock(apiLocker, 'promotion_apply', async () => {
                                return await promotionCodeHandler(api, {
                                    code: twitterParseResult.code as string,
                                    address: twitterParseResult.address as string,
                                    twitterId: twitterParseResult.user as string
                                } as IPromotionApplicant, db);
                        }, {
                            value: "🤯 Faucet is busy, please try it later."
                        });
                        msg.reply(applyResult.value);
                    } else {
                        msg.reply(twitterParseResult.result as string)
                    }
                }
            }
        });
    
        client.login(token);
    })
        .catch(() => process.exit(1))

}

// TODO: add error handling
const main = async () => {

    await pRetry(bot, {
        onFailedAttempt: error => {
            console.log(
                `${error.message} - Retry attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
            );
        },
        retries: 10,
    })
};

async function handleWithLock(lockTx: any, key: string, handler: Function, error: any) {
    if (lockTx[key]) {
        return error;
    }
    try {
        lockTx[key] = true;
        return await timeout(
            new Promise((resolve, reject) => {
              handler().then(resolve).catch(reject);
            }),
            2 * 60 * 1000 // 2 min will timeout
        );
    } finally {
        delete lockTx[key];
    }
}

main().catch(e => {
    l.error(e);
    process.exit(1);
});