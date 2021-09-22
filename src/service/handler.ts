import { ApiPromise } from "@polkadot/api";
import { transferStorageFee } from "../crustApi";
import DB from "../db";
import { IPromotionApplicant } from "../db/models/promotionApplicant.model";
import { GithubApplicant } from "./githubApi";

export async function githubHandler(api: ApiPromise, ghApplicant: GithubApplicant, db: DB) {
    try {
        const maybeApplied = await db.maybeExistGithubApplicant(ghApplicant.githubId, ghApplicant.address);
        if (maybeApplied) {
            return {
                ok: false,
                value: "️⚠️  Your Github account or Crust address has already applied"
            }
        } else {
            const txResult = await transferStorageFee(api, ghApplicant.address);
            if (txResult.status) {
                await db.saveGithubApplicant(ghApplicant.githubId, ghApplicant.githubName, ghApplicant.address);
                return {
                    ok: true,
                    value: "🥳  Apply successfully! Please enjoy your journey of decentralized storage with Crust. Next you can refer wiki's **build**(https://wiki.crust.network/docs/en/buildGettingStarted) section to try Crust and IPFS!",
                };
            } else {
                return {
                    ok: false,
                    value: txResult.details,
                };
            }
        }
    } catch (error) {
        return {
            ok: false,
            value: '💥 Something went wrong',
        };
    }
}

export async function promotionCodeHandler(api: ApiPromise, iPA: IPromotionApplicant, db: DB) {
    try {
        const maybeApplied = await db.maybeExistTwitterApplicant(iPA.twitterId, iPA.code);
        if (maybeApplied) {
            return {
                ok: false,
                value: "️⚠️ Your Twitter account has already applied with this promo code"
            }
        } else {    
            const usePromoCodeSuccessful = await db.usePromotionCode(iPA.code);
            if (usePromoCodeSuccessful) {
                const result = await transferStorageFee(api, iPA.address);
                if (result.status) {
                    await db.savePromotionApplicant(iPA.code, iPA.twitterId, iPA.address);
                    return {
                        ok: true,
                        value: "🥳  Apply successfully! Please enjoy your journey of decentralized storage with Crust. Next you can refer wiki's **build**(https://wiki.crust.network/docs/en/buildGettingStarted) section to try Crust and IPFS!",
                    };
                } else {
                    await db.promotionRollback(iPA.code);
                    return {
                        ok: false,
                        value: result.details
                    }
                }
            }
            return {
                ok: false,
                value: "⚠️ Invalid promo code",
            };
        }
    } catch (error) {
        return {
            ok: false,
            value: "💥 Something went wrong",
        };
    }
}