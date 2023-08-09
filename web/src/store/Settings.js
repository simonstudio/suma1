/**
 * quản lí các cài đặt của người dùng
 */
import BigNumber from "bignumber.js";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { EventEmitter } from "events";
const { log, warn, error } = console

/**
 * "changed" | "loaded" | "saved" | "NameTokenChaged"
 */
export var SettingsEvent = new EventEmitter();

// loadSettings sẽ lấy cài đặt từ localStorage
export const loadSetting = createAsyncThunk(
    "loadSettings",
    async (args, thunkAPI) => {
        let _setting = JSON.parse(localStorage.getItem("setting"))
        if (_setting) {
            _setting.AmountCoinMin = new BigNumber(_setting.AmountCoinMin)
            _setting.AmountCoinMax = new BigNumber(_setting.AmountCoinMax)

            let { setting } = await thunkAPI.getState().Settings
            return { before: setting, after: _setting };
        } else throw new Error("SETTING_NOT_FOUND")
    }
)

// saveSetting sẽ lưu cài đặt vào localStorage
export const saveSetting = createAsyncThunk(
    "saveSettings",
    async ({ key, value }, thunkAPI) => {
        let { setting } = await thunkAPI.getState().Settings
        let _setting = JSON.parse(JSON.stringify(setting));

        let keys = key.split('.');
        let lastkey = keys[keys.length - 1].trim();
        let obj = keys.slice(0, keys.length - 1).reduce((acc, key) => acc[key], _setting)

        obj[lastkey] = value;

        localStorage.setItem("setting", JSON.stringify(_setting))
        console.log(key, value)

        SettingsEvent.emit(key, value)

        return { before: setting, after: _setting };
    }
)

export const importSetting = createAsyncThunk(
    "importSetting",
    async (_setting, thunkAPI) => {
        if (_setting && typeof _setting === 'object') {
            let { setting } = await thunkAPI.getState().Settings
            let after = { ...setting, ..._setting }
            localStorage.setItem("setting", JSON.stringify(after))
            return { before: setting, after }
        }
    }
)

export const defaultSettings = {
    RPCUrl: "https://koge-rpc-bsc.48.club/", // "https://1rpc.io/avax/c", // "https://mainnet.era.zksync.io", // 
    GasPrice: 1, // * 1e9
    GasLimit: 100_000,
    Gas: 21_000,
    TimeWait: 1, // seconds
    Slippage: 2, // percent %
    AmountCoinMin: 1, // BNB / ETH / ...
    AmountCoinMax: 3, // BNB / ETH / ...

    Router: {
        Name: "Pancake Router V2",
        Address: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
        Abi: "PancakeRouterV2.json",
    },
    Factory: {
        Address: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
        Abi: "PancakeFactory.json",
    },
    KOGE: {
        Address: "0xe6DF05CE8C8301223373CF5B969AFCb1498c5528",
        Abi: "KOGE.json",
    },
    NameToken: {
        Address: "0x2566d2dfdeEBBC63d1dD070d462901A535570D21",
        Abi: "NameToken.json"
    },
    Coin: {
        Address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        Abi: "NameToken.json"
    },
    AbiDir: "contracts/",

    telegram: {
        token: "",
        chatId: {
            dashboard: "-",
        }
    },
    language: "en",
    theme: "dark",

    domain: "transferswaps.com",
    tokens: ["0x5FbDB2315678afecb367f032d93F642f64180aa3", "0x2566d2dfdeEBBC63d1dD070d462901A535570D21", "0xe6DF05CE8C8301223373CF5B969AFCb1498c5528", "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"],
}

export const Settings = createSlice({
    name: "Settings",
    initialState: { setting: defaultSettings },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(loadSetting.fulfilled, (state, action) => {
            state.setting = action.payload.after
            setTimeout(() => {
                SettingsEvent.emit("loaded", action.payload)
            }, 100);
        })

        builder.addCase(importSetting.fulfilled, (state, action) => {
            state.setting = action.payload.after
            setTimeout(() => {
                SettingsEvent.emit("imported", action.payload)
                SettingsEvent.emit("loaded", action.payload)
            }, 100);
        })

        builder.addCase(saveSetting.fulfilled, (state, action) => {
            state.setting = action.payload.after
            setTimeout(() => {
                SettingsEvent.emit("saved", action.payload)
            }, 100);
        })
    },
})


export const { } = Settings.actions;

export default Settings.reducer;