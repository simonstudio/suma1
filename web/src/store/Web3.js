/**
 * quản lí web3 từ trình duyệt
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Web3 from "web3";
import { toast } from "react-toastify"
import { log, warn, error } from "../std"
import { EventEmitter } from "events";

export var Web3Event = new EventEmitter();

const dev = {
    TEST: 'TEST',
    MAINNET: 'MAINNET'
}

export const CHAINS = {
    1337: {
        id: 1337,
        nativeCurrency: {
            name: 'Ether test', decimals: 18, symbol: 'ETH'
        },
        chainId: Web3.utils.toHex(1337),
        icon: "eth.svg",
        rpcUrls: ['HTTP://127.0.0.1:8545'],
        chainName: 'Local',
        blockExplorerUrls: "http://localhost:8545/",
        dev: dev.TEST,
    },
    31337: {
        id: 31337,
        nativeCurrency: {
            name: 'Ether test', decimals: 18, symbol: 'ETH'
        },
        chainId: Web3.utils.toHex(31337),
        icon: "eth.svg",
        rpcUrls: ['http://127.0.0.1:8545/'],
        chainName: 'Local',
        blockExplorerUrls: "http://127.0.0.1:8545/",
        dev: dev.TEST,
    },
    5777: {
        id: 5777,
        nativeCurrency: {
            name: 'Ether test', decimals: 18, symbol: 'ETH'
        },
        chainId: Web3.utils.toHex(5777),
        icon: "eth.svg",
        rpcUrls: ['HTTP://127.0.0.1:7545'],
        chainName: 'Local',
        blockExplorerUrls: "http://localhost:8545/",
        dev: dev.TEST,
    },
    1: {
        id: 1,
        nativeCurrency: {
            name: 'Ethereum', decimals: 18, symbol: 'ETH'
        },
        chainId: Web3.utils.toHex(1),
        icon: "eth.svg",
        rpcUrls: ['wss://mainnet.infura.io/v3/d41e02ee7f344eb6ba4b9239f853de51'],
        chainName: 'Ethereum',
        blockExplorerUrls: ['https://etherscan.io/'],
        dev: dev.MAINNET
    },
    5: {
        id: 5,
        nativeCurrency: {
            name: 'Ethereum', decimals: 18, symbol: 'ETH'
        },
        chainId: Web3.utils.toHex(5),
        icon: "eth.svg",
        rpcUrls: ['https://goerli.infura.io/v3/d41e02ee7f344eb6ba4b9239f853de51'],
        chainName: 'Goerli',
        blockExplorerUrls: ['https://goerli.etherscan.io/'],
        dev: dev.TEST
    },
    97: {
        id: 97,
        nativeCurrency: {
            name: 'tBNB', decimals: 18, symbol: 'tBNB'
        },
        icon: "bnb.svg",
        chainId: Web3.utils.toHex(97),
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        chainName: 'Binance Smart Chain Testnet',
        blockExplorerUrls: ['https://testnet.bscscan.com/'],
        iconUrls: "https://testnet.bscscan.com/images/svg/brands/bnb.svg",
        dev: dev.TEST,
    },
    56: {
        id: 56,
        nativeCurrency: {
            name: 'BNB', decimals: 18, symbol: 'BNB'
        },
        chainId: Web3.utils.toHex(56),
        icon: "bnb.svg",
        rpcUrls: ['https://bsc-dataseed1.binance.org'],
        chainName: 'Binance Smart Chain',
        blockExplorerUrls: ['https://bscscan.com/'],
        iconUrls: "https://bscscan.com/images/svg/brands/bnb.svg",
        dev: dev.MAINNET,
    },
    137: {
        id: 137,
        nativeCurrency: {
            name: 'Polygon', decimals: 18, symbol: 'MATIC'
        },
        chainId: Web3.utils.toHex(137),
        icon: "bnb.svg",
        rpcUrls: ['https://polygonscan.com'],
        chainName: 'Polygon',
        blockExplorerUrls: ['https://polygonscan.com/'],
        iconUrls: "https://bscscan.com/images/svg/brands/bnb.svg",
        dev: dev.MAINNET,
    },

    arbitrum: {
        id: 42161,
        nativeCurrency: {
            name: 'Arbitrum', decimals: 18, symbol: 'ARB'
        },
        chainId: Web3.utils.toHex(42161),
        rpcUrls: ['https://arb-mainnet.g.alchemy.com/v2/QSuJnN440-D76zeC9srLgjq1oOahYxjj'],
        chainName: 'Arbitrum',
        blockExplorerUrls: ['https://arbiscan.io/'],
        iconUrls: "https://testnet.arbiscan.io/images/svg/brands/arbitrum.svg",
        dev: dev.MAINNET,
    },
    arbitrumTest: {
        id: 421613,
        nativeCurrency: {
            name: 'Arbitrum Test', decimals: 18, symbol: 'ARB'
        },
        chainId: Web3.utils.toHex(421613),
        rpcUrls: ['https://arb-goerli.g.alchemy.com/v2/GCDxJ9D1qG3ywdPTz5xTh-5INI6GT-uw'],
        chainName: 'Arbitrum Test',
        blockExplorerUrls: ['https://arbiscan.io/'],
        iconUrls: "https://testnet.arbiscan.io/images/svg/brands/arbitrum.svg",
        dev: dev.TEST,
    },
    "tron": {
        id: "tron",
        nativeCurrency: {
            name: 'Tron', decimals: 18, symbol: 'TRX'
        },
        chainId: Web3.utils.toHex("tron"),
        icon: "tron.svg",
        rpcUrls: ['https://api.trongrid.io'],
        chainName: 'Tron',
        blockExplorerUrls: ['https://tronscan.org/'],
        iconUrls: "https://static.tronscan.org/production/logo/trx.png",
        dev: dev.MAINNET,
    },
    80001: {
        id: 80001,
        nativeCurrency: {
            name: 'MATIC', decimals: 18, symbol: 'MATIC'
        },
        chainId: Web3.utils.toHex(80001),
        rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
        chainName: 'Polygon Testnet',
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
        dev: dev.TEST
    },
    43113: {
        id: 43113,
        nativeCurrency: {
            name: 'AVAX', decimals: 18, symbol: 'AVAX'
        },
        chainId: Web3.utils.toHex(43113),
        rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
        chainName: 'Avalanche Testnet',
        blockExplorerUrls: ['https://testnet.snowtrace.io/'],
        dev: dev.TEST,
    },
    43114: {
        id: 43114,
        nativeCurrency: {
            name: 'AVAX', decimals: 18, symbol: 'AVAX'
        },
        chainId: Web3.utils.toHex(43114),
        rpcUrls: ['https://avalanche.public-rpc.com'],
        chainName: 'Avalanche',
        blockExplorerUrls: ['https://snowtrace.io/'],
        dev: dev.MAINNET,
    },
    59140: {
        id: 59140,
        nativeCurrency: {
            name: 'linea goerli', decimals: 18, symbol: 'ETH'
        },
        chainId: Web3.utils.toHex(59140),
        rpcUrls: ['https://linea-goerli.infura.io/v3/7b758e41cdea45c1a32f547d039b66ed'],
        chainName: 'linea goerli',
        blockExplorerUrls: ['https://snowtrace.io/'],
        dev: dev.MAINNET,
    },


    getParamsById: (id) => {
        //copy params
        let params = { ...Object.values(CHAINS).find(item => item.id === id) };
        const listParams = ['nativeCurrency', 'chainId', 'rpcUrls', 'chainName', 'blockExplorerUrls'];
        Object.keys(params).map(v => {
            if (!listParams.includes(v)) delete params[v];
        });
        return params;
    },
}
if (window.ethereum)
    window.ethereum.on('chainChanged', (_chainId) => window.location.reload());

export const connectWeb3 = createAsyncThunk(
    'connectWeb3',
    async (args, thunkAPI) => {
        // Wait for loading completion to avoid race conditions with web3 injection timing.
        // Modern dapp browsers...
        let web3 = null;
        let accounts = [];
        let chainId = 0;
        // console.log(args);
        try {
            if (window.ethereum) {
                web3 = new Web3(window.ethereum);
                // Request account access if needed
                await window.ethereum.enable();
                // Accounts now exposed
            }
            // else if (window.tronWeb) {
            //     return window.tronLink.request({ method: 'tron_requestAccounts' }).then(r => {
            //         if (r.code == 200) {
            //             return { "web3": window.tronWeb, "accounts": [window.tronWeb.defaultAddress.base58], "chainId": "tron" };
            //         } else {
            //             toast.error(r.message)
            //             throw new Error(r.message)
            //         }
            //     })
            // }
            // Legacy dapp browsers...
            else if (window.web3) {
                // Use Mist/MetaMask's provider.
                web3 = window.web3;
                // log("Injected web3 detected.");
            }
            // Fallback to localhost; use dev console port by default...
            else {
                const provider = new Web3.providers.HttpProvider(
                    "http://127.0.0.1:8545"
                );
                web3 = new Web3(provider);
                // log("No web3 instance injected, using Local web3.");
            }
            accounts = await web3.eth.getAccounts();
            chainId = await web3.eth.getChainId();
            chainId = parseInt(chainId);
        } catch (error) {
            throw error;
        }
        window.web3 = web3;
        window.thunk = thunkAPI;
        return { web3, accounts, chainId };
    }
)

let _switchChain;

export const switchChain = createAsyncThunk(
    "switchChain",
    _switchChain = async (args, thunkAPI) => {

        let chainId = parseInt(args);
        if (chainId === 1337) chainId = 5777;

        let web3 = await thunkAPI.getState().Web3.web3;
        if (chainId == window.ethereum.networkVersion) return chainId
        if (!isNaN(chainId) && chainId != parseInt(window.ethereum.networkVersion)) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: web3.utils.toHex(chainId) }]
                })
                return window.ethereum.networkVersion;
            } catch (error) {
                // if chain was not added, add chain
                if (error.code === 4902 || error.code === -32603) {
                    let params = CHAINS.getParamsById(chainId);
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [params]
                        })
                        toast.success(["add chain " + params.chainName + " success"])
                        return _switchChain(args, thunkAPI);
                    } catch (error) {
                        console.error(error);
                        toast.error(error.message)
                    }
                } else {
                    console.error("chain error ", error)
                    toast.error(error.message)
                }
            }
        }
    }
)

export const web3Slice = createSlice({
    name: "web3",
    initialState: {
        web3: null,
        accounts: [],
        chainId: 5777,
        chainName: "web3"
    },
    reducers: {
        updateAccounts: (state, action) => {
            state.accounts = action.payload;
        },
        updateChain: (state, action) => {
            state.chainId = action.payload[0];
        }
    },
    extraReducers: (builder) => {
        builder.addCase(connectWeb3.fulfilled, (state, action) => {
            state.web3 = action.payload.web3;
            Web3Event.emit("changed", action.payload.web3)

            if (action.payload.accounts.length > 0 && CHAINS[action.payload.chainId]) {
                state.accounts = action.payload.accounts;
                state.chainId = action.payload.chainId;
                state.chainName = CHAINS[action.payload.chainId].chainName;
            };
            if (window.ethereum) {
                // detect Metamask account change
                window.ethereum.on('accountsChanged', function (accounts) {
                    console.log('accountsChanges', accounts);
                    window.location.reload();
                });

                // detect Network account change
                window.ethereum.on('networkChanged', function (networkId) {
                    console.log('networkChanged', networkId);
                    window.location.reload();
                });
            }
        });

        builder.addCase(switchChain.fulfilled, (state, action) => {
            state.chainId = parseInt(action.payload)
            log('switched Chain: ', action.payload)
        })
    },
})


export const { updateAccounts, updateChain } = web3Slice.actions;
// log("actions", web3Slice)

export default web3Slice.reducer;