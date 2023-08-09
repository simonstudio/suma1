/**
 * kết nối tới web socket server 
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { w3cwebsocket } from 'websocket';
import { toast } from "react-toastify";
import { EventEmitter } from "events";


export var event = new EventEmitter();

let _connectWebsocketServer;
export const connectWebsocketServer = createAsyncThunk(
    'connectWebsocketServer',
    _connectWebsocketServer = (url, thunkAPI) => new Promise((rs, rj) => {
        if (!url) url = thunkAPI.getState().WebSocket.url;
        let { event } = thunkAPI.getState().WebSocket;
        let ws = new w3cwebsocket(url)
        ws.marked = Date.now()
        ws.onopen = () => {
            thunkAPI.dispatch(setState(true))
            ws.Send = (data) => {
                ws.send(JSON.stringify(data))
                return event;
            }
            console.log("ws.onopen", Date.now());
        }

        ws.onmessage = ({ data }) => {
            // console.log(data);
            try {
                let msg = JSON.parse(data);
                // console.log(msg);
                event.emit(msg.requestId, msg)
            } catch (error) {
                console.error(error)
                toast.error(error.message)
            }
        }

        ws.onclose = function (e) {
            thunkAPI.dispatch(setState(false))
            console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
            setTimeout(function () {
                ws.onclose = ws.onopen = undefined
                ws.close()
                ws = null
                // thunkAPI.dispatch(connectWebsocketServer())
            }, 1000);
        };

        ws.onerror = function (err) {
            console.error('Socket encountered error: ', err.message, 'Closing socket');
            ws.close();
        };

        rs({ ws, url })
    })
)

export const WssSlice = createSlice({
    name: "WssSlice",
    initialState: {
        url: (window.location.protocol == 'https:' ? 'wss://' : 'ws://') + (new URL(document.location.href)).hostname + ":" + 3003,
        WebSocket: null,
        connected: false,
    },

    reducers: {
        setState: (state, action) => {
            state.connected = action.payload
        },
    },

    extraReducers: (builder) => {
        builder.addCase(connectWebsocketServer.fulfilled, (state, action) => {
            state.url = action.payload.url;
            state.WebSocket = action.payload.ws;
            event.emit("changed", action.payload.ws)
        });
    },
})


export const { setState } = WssSlice.actions; // reducers

export default WssSlice.reducer;