import connect from "./connect";
import GithubApplicant from './models/githubApplicant.model';
import PromotionCodes from './models/promotionCodes.model';
import PromotionApplicant from './models/promotionApplicant.model';

export default class DB {
    constructor(endpoint: string) {
        connect(endpoint);
    }

    async maybeExistGithubApplicant(githubId: string, address: string) {
        return GithubApplicant.findOne({
            $or: [
                { 'githubId': githubId },
                { 'address': address }
            ]
        }).exec();
    }

    async maybeExistTwitterApplicant(twitterId: string, code: string) {
        return PromotionApplicant.findOne({
            $and: [
                { 'twitterId': twitterId },
                { 'code': code }
            ]
        }).exec()
    }

    async saveGithubApplicant(githubId: string, githubName: string, address: string) {
        return await GithubApplicant.create({
            githubId,
            githubName,
            address,
        })
            .then(() => true)
            .catch(_ => false);
    }

    async promotionRollback(promotionCode: string) {
        const maybeExistedApplicant = await PromotionCodes.findOne({
            code: promotionCode,
        }).exec();
        if (maybeExistedApplicant) {
            maybeExistedApplicant.providedCount += 1;
            await maybeExistedApplicant.save().then(e => {
                console.log(`code: ${promotionCode} the number of times available after rollback is`, e.providedCount) 
                return e.providedCount >= 0 ? 1 : 0
            });
        }
    }

    async savePromotionApplicant(promotionCode: string, twitterId: string, address: string) {
        return await PromotionApplicant.create({
            code: promotionCode,
            address,
            twitterId
        })
            .then(() => console.log(`save applicant ${address} success`))
            .catch(_ => 0);
    }

    async usePromotionCode(
        promotionCode: string
    ): Promise<number> {
        const maybeExistedApplicant = await PromotionCodes.findOne({
            code: promotionCode,
        }).exec();
        if (maybeExistedApplicant) {
            if (
                maybeExistedApplicant.providedCount > 0
            ) {
                maybeExistedApplicant.providedCount -= 1;
                const result = await maybeExistedApplicant.save().then(e => {
                    console.log(`code: ${promotionCode} remaining available times: `, e.providedCount) 
                    return e.providedCount >= 0 ? 1 : 0
                });
                return result;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }
}