import { ApiPromise } from '@polkadot/api';
import { storagePoolSeeds } from './consts';
import { sendTx } from './util/tx';
import { trasferAmount } from './consts'; 
import BN from 'bn.js';

const UNIT = new BN(1_000_000_000_000);

export async function transferStorageFee(api: ApiPromise, address: string, amount: number = trasferAmount) {
    try {
        // 1. Try connect to Crust Network
        await api.isReadyOrError;
        const tx = api.tx.balances.transfer(
            address,
            UNIT.mul(new BN((amount * 1000).toString())).divn(1000).toString()
        );
        const res = await sendTx(api, tx, storagePoolSeeds as string);
        if (res?.status) {
            console.log(`Make ${address} free strorage success`);
        } else {
            console.error(
                `Make ${address} free strorage failed with Send ${res?.details}`
            );
            
            if (res?.details?.toString().includes('Balance too low to send value')) {
                return {
                    status: false,
                    message: 'Error',
                    details: `🈳 Today's faucet is empty, please try it tomorrow.`
                }
            } else {
                return {
                    status: false,
                    message: 'Error',
                    details: `🚫 Error occurred during request Crust chain, please try it later.`
                };
            }
            //   throw new Error(`Make ${address} free strorage failed with ${res?.details}`);
        }
        return res;
    } catch (e: any) {
        return {
            status: false,
            message: 'Error',
            details: `🚫 Error occurred during request Crust chain, please try it later.`
        }
    }
}
