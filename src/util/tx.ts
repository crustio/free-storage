import { SubmittableExtrinsic } from '@polkadot/api/types';
// eslint-disable-next-line node/no-extraneous-import
import { Keyring } from '@polkadot/keyring';
// eslint-disable-next-line node/no-extraneous-import
import { ISubmittableResult } from '@polkadot/types/types';
import { DispatchError } from '@polkadot/types/interfaces';
import { ITuple } from '@polkadot/types/types';
import { ApiPromise } from '@polkadot/api';

export interface TX_RESULT {
    status: boolean,
    message?: string,
    details?: string,
}

/**
 * Send tx to Crust Network
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
async function sendTx(
    api: ApiPromise,
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    seeds: string
): Promise<TX_RESULT> {
    console.log('⛓  Send tx to chain...');
    const krp = loadKeyringPair(seeds);

    return new Promise((resolve, reject) => {
        tx.signAndSend(krp, ({ events = [], status }) => {
            console.log(
                `  ↪ 💸  Transaction status: ${status.type}, nonce: ${tx.nonce}`
            );

            if (
                status.isInvalid ||
                status.isDropped ||
                status.isUsurped ||
                status.isRetracted
            ) {
                reject(new Error('Invalid transaction'));
            } else {
                // Pass it
            }

            if (status.isInBlock) {
                events.forEach(({ event: { method, section, data } }) => {
                    if (section === 'system' && method === 'ExtrinsicFailed') {
                        // Error with no detail, just return error
                        console.error(`  ↪ ❌  Send transaction(${tx.type}) failed.`);
                        const [dispatchError] = (data as unknown) as ITuple<
                            [DispatchError]
                        >;
                        if (dispatchError.isModule) {
                            try {
                                const mod = dispatchError.asModule;
                                const error = api.registry.findMetaError(
                                    new Uint8Array([mod.index.toNumber(), mod.error.toNumber()])
                                );
                                resolve({
                                    status: false,
                                    message: `${error.section}.${error.name}`,
                                    details: error.documentation.join(''),
                                })
                            } catch (e: any) {
                                resolve({
                                    status: false,
                                    message: 'Error',
                                    details: e.message
                                })
                            }
                        }
                    } else if (method === 'ExtrinsicSuccess') {
                        console.log(`  ↪ ✅  Send transaction(${tx.type}) success.`);
                        resolve({
                            status: true
                        });
                    }
                });
            } else {
                // Pass it
            }
        }).catch((e: any) => {
            resolve({
                status: false,
                message: 'Error',
                details: e.message
            });
        });
    });
}

/**
 * Load keyring pair with seeds
 * @param {string} seeds
 */
function loadKeyringPair(seeds: string) {
    const kr = new Keyring({
        type: 'sr25519',
    });

    const krp = kr.addFromUri(seeds);
    return krp;
}

export { sendTx, loadKeyringPair };
