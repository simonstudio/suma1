import { configureStore } from '@reduxjs/toolkit'
import Web3Reducer from './Web3'

export default configureStore({
    reducer: {
        Web3: Web3Reducer
    },

    middleware: (getDefaultMiddleware: (arg0: { serializableCheck: boolean }) => any) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
})
