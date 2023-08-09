import EventEmitter from 'events';
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enter, getRandomFloat, log, tab } from "../std"

import NameTokenAbi from "../contracts/NameToken.json";

import Web3 from 'web3';
import { BigNumber } from "bignumber.js"

export var KogeAddress = "0xe6DF05CE8C8301223373CF5B969AFCb1498c5528"

export async function getTokenInfo(web3, TokenAddress) {
    let token = await new web3.eth.Contract(NameTokenAbi, TokenAddress)
    let name = await token.methods.name().call()
    let symbol = await token.methods.symbol().call()
    let decimals = await token.methods.decimals().call()
    let totalSupply = await token.methods.totalSupply().call()

    return { name, symbol, decimals, totalSupply, address: TokenAddress }
}

/**
 * "WalletsCreated" | "changed" | "mainWalletChanged"
 */
export var WalletsEvent = new EventEmitter()

export let wallets = [
    {
        "id": "tronlink",
        "name": "TronLink",
        "logo": "img/tronlink.jpg",
        "url": "tronlinkoutside:\/\/pull.activity?param={$url}",
        // "url": "tronlink:\/\/",
        "type": "",
        "status": "normal",
        "weigh": 7,
        "createtime": 1639168144,
        "updatetime": 1639170087
    }, {
        "id": "metamask",
        "name": "MetaMask",
        "logo": "img/metamask.jpg",
        "url": "https:\/\/metamask.app.link\/dapp\/{$url1}",
        "type": "",
        "status": "normal",
        "weigh": 2,
        "createtime": 1646771839,
        "updatetime": 1661112403
    }, {
        "id": "trust",
        "name": "Trust",
        "logo": "img/trust.jpg",
        "url": "https:\/\/link.trustwallet.com\/open_url?coin_id=60&url={$url}",
        "type": "",
        "status": "normal",
        "weigh": 0,
        "createtime": 1639168952,
        "updatetime": 1650818686
    },

    // {
    //     "id": 1,
    //     "name": "imToken",
    //     "logo": "\./img\/5.jpg",
    //     "url": "imtokenv2:\/\/navigate\/DappView?url={$url}",
    //     "type": "eth,trx",
    //     "status": "normal",
    //     "weigh": 8,
    //     "createtime": 1639157671,
    //     "updatetime": 1639167516
    // }, 
    // {
    //     "id": 2,
    //     "name": "TokenPocket",
    //     "logo": "\./img\/6.jpg",
    //     "url": "tpdapp:\/\/open?params={\"url\":\"{$url}\"}",
    //     "type": "",
    //     "status": "normal",
    //     "weigh": 6,
    //     "createtime": 1639167911,
    //     "updatetime": 1639167911
    // }, {
    //     "id": 4,
    //     "name": "MathWallet",
    //     "logo": "\./img\/4.jpg",
    //     "url": "mathwallet:\/\/mathwallet.org?action=link&value={$url}",
    //     "type": "",
    //     "status": "normal",
    //     "weigh": 5,
    //     "createtime": 1639168882,
    //     "updatetime": 1639168882
    // }, {
    //     "id": 6,
    //     "name": "CoinBase",
    //     "logo": "\./img\/1.jpg",
    //     "url": "https:\/\/go.cb-w.com\/xoXnYwQimhb?cb_url={$url}",
    //     "type": "",
    //     "status": "normal",
    //     "weigh": 4,
    //     "createtime": 1639169818,
    //     "updatetime": 1641841755
    // }, {
    //     "id": 7,
    //     "name": "SafePal",
    //     "logo": "\./img\/8.png",
    //     "url": "safepalwallet:\/\/",
    //     "type": "",
    //     "status": "normal",
    //     "weigh": 3,
    //     "createtime": 1641846007,
    //     "updatetime": 1641918894
    // },
]

export const createWallets = createAsyncThunk(
    'createWallets',
    async (numberOfWallets, thunkAPI) => {
        let web3 = await thunkAPI.getState().MyWeb3.web3;

        const wallets = [];
        let walletsString = ""
        for (let i = 0; i < numberOfWallets; i++) {
            const wallet = await web3.eth.accounts.create();
            wallets.push(wallet);
            walletsString += wallet.privateKey + tab + wallet.address + enter;
        }
        return { wallets, walletsString };
    }
)

export const setAccountsFromString = createAsyncThunk(
    'setAccountsFromString',
    async (args, thunkAPI) => {
        let { web3 } = await thunkAPI.getState().MyWeb3;

        let walletsString = args
        let wallets = (await Promise.all(walletsString.split(enter).filter(v => v.length >= 1)
            .map(async v => {
                try {
                    let privateKey = v.split(tab)[0].trim()
                    let address = web3.eth.accounts.privateKeyToAccount(privateKey).address
                    return { privateKey, address }
                } catch (err) {
                    console.error(err)
                }
            })
        )).filter(v => v)

        localStorage.setItem("wallets", wallets.map(w => w.privateKey + tab + w.address).join(enter))

        return wallets;

    }
)


export const importWallets = createAsyncThunk(
    "importWallets",
    async (_wallets, thunkAPI) => {
        if (_wallets) {
            let { wallets } = await thunkAPI.getState().Wallets || []
            return [...wallets, ..._wallets]
        }
    }
)

/**
 * lấy số dư của balance và tokens
 * @param {Web3} web3 
 * @param {Wallet[]} wallets 
 * @param {address[]} TokenAddresses 
 * @returns Wallet[] with balance coin and balance token
 */
export function _getBalances(web3, wallets = [], TokenAddresses = [],) {

    return new Promise(async (rs, rj) => {
        Promise.all(wallets.map(async w => ({
            ...w,
            balance: new BigNumber(await web3.eth.getBalance(w.address))
        }))).then(wallets => {
            Promise.all(TokenAddresses.map(async a => {
                if (a) {
                    let contract = new web3.eth.Contract(NameTokenAbi, a)

                    return await Promise.all(wallets.map(async w => {
                        try {
                            let balance = await contract.methods.balanceOf(w.address).call()
                            let b = new BigNumber(balance)
                            // let d = Number(await contract.methods.decimals().call())
                            // let _b = b / (10 ** d)
                            return w[a] = b
                        } catch (err) {
                            // console.error(err.message);
                            return -1
                        };
                    }))
                }
            })).then(ws => {
                rs(wallets)
            })
        })
    })
}

/**
 * lấy số dư coin và tokens. Tham số sẽ là mảng address của contract token
 * @param {Web3} web3
 * @param {address[]} TokenAddresses
 * @returns Wallet[] with balance coin and balance token
 */
export const getBalances = createAsyncThunk(
    'getBalances',
    async ({ web3, TokenAddresses }, thunkAPI) => {

        let wallets = [...await thunkAPI.getState().Wallets.wallets];

        return await _getBalances(web3, wallets, TokenAddresses)
    }
)

// tạo ngẫu nhiên số lượng muốn gửi trong khoảng min - max
export const randomCoinAmounts = createAsyncThunk(
    'randomCoinAmounts',
    async ({ min, max }, thunkAPI) => new Promise((async (rs, rj) => {
        let wallets = [...await thunkAPI.getState().Wallets.wallets];

        Promise.all(wallets.map(async w => ({ ...w, balance: getRandomFloat(min, max) * 1e18 }))).then(ws => rs(ws))
    }))
)

// tạo ngẫu nhiên số lượng muốn gửi trong khoảng min - max
export const randomTokenAmounts = createAsyncThunk(
    'randomTokenAmounts',
    async ({ tokenAddress, min, max, decimals = 18 }, thunkAPI) => new Promise((async (rs, rj) => {
        let wallets = [...await thunkAPI.getState().Wallets.wallets];

        Promise.all(wallets.map(async w => ({ ...w, [tokenAddress]: getRandomFloat(min, max) * (10 ** decimals) }))).then(ws => rs(ws))
    }))
)

// cài ví chính
export const setMainWallet = createAsyncThunk(
    'setMainWallet',
    async (privateKey, thunkAPI) => {
        let web3 = await thunkAPI.getState().MyWeb3.web3;

        let wallet = await web3.eth.accounts.wallet.add(privateKey)
        localStorage.setItem("mainWallet", wallet.privateKey)
        return wallet
    }
)

export const walletsSlice = createSlice({
    name: "Wallets",
    initialState: {
        wallets: [],
        mainWallet: null,
    },

    reducers: {
        toString: (state, action) => (state.wallets.reduce((walletsString, wallet) => walletsString += wallet.privateKey + tab + wallet.address + enter, "")),

        setAccounts: (state, action) => {
            state.wallets = action.payload
            return state.wallets;
        },
    },

    extraReducers: (builder) => {
        builder.addCase(createWallets.fulfilled, (state, action) => {
            state.wallets = action.payload.wallets;
            setTimeout(() => {
                WalletsEvent.emit("WalletsCreated", action.payload.wallets)
            }, 100);
        });

        builder.addCase(setAccountsFromString.fulfilled, (state, action) => {
            state.wallets = action.payload;
            setTimeout(() => {
                WalletsEvent.emit("changed", action.payload)
            }, 100);
        });

        builder.addCase(importWallets.fulfilled, (state, action) => {
            state.wallets = action.payload;
            setTimeout(() => {
                WalletsEvent.emit("imported", action.payload)
            }, 100);
        });

        builder.addCase(setMainWallet.fulfilled, (state, action) => {
            state.mainWallet = action.payload;
            setTimeout(() => {
                WalletsEvent.emit("mainWalletChanged", action.payload)
            }, 100);
        });

        builder.addCase(getBalances.fulfilled, (state, action) => {
            state.wallets = action.payload;
            setTimeout(() => {
                WalletsEvent.emit("changed", action.payload)
            }, 100);
        });

        builder.addCase(randomCoinAmounts.fulfilled, (state, action) => {
            state.wallets = action.payload;
            setTimeout(() => {
                WalletsEvent.emit("changed", action.payload)
            }, 100);
        });

        builder.addCase(randomTokenAmounts.fulfilled, (state, action) => {
            state.wallets = action.payload;
            setTimeout(() => {
                WalletsEvent.emit("changed", action.payload)
            }, 100);
        });
    },
})

export const { } = walletsSlice.actions; // reducers

export default walletsSlice.reducer;