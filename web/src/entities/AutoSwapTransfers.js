import Web3 from "web3";
import BigNumber from "bignumber.js";
import EventEmitter from 'events';
import moment from "moment";
import axios from 'axios';
import { log } from "../std";

window.BigNumber = BigNumber


class AutoSwapTransfers {
    MyWeb3; GasPrice;
    Setting = {}
    /**
     * @param {string}
     * sendCoinStart
     * sendCoinSuccess
     * sendCoinFinish
     * sendCoinError
     * sendCoinPause
     * TokenApproved
     * TokenApproveError
     */
    Event = undefined;

    /**
     * 
     * @param {Web3} web3 
     * @param {object} setting 
     */
    constructor(web3, setting) {
        this.MyWeb3 = web3 || new Web3(setting.RPCUrl || "https://bsc-dataseed.binance.org/");
        this.Setting = setting
        this.Event = new EventEmitter();
    }

    /**
     * tạo biến event và các hàm pause, stop
     * hàm continuous sẽ được tạo bên trong hàm thực thi
     * @returns {EventEmitter}
     */
    newEventFunctions() {
        let event = new EventEmitter()
        /**
         * tạo hàm gọi sự kiện riêng để thêm sự kiện *, để lắng nghe tất cả sự kiện
         * @param {string} name 
         * @param  {...any} args 
         */
        event.Emit = (name, ...args) => {
            event.emit("*", ...args)
            event.emit(name, ...args)
        }
        event.STATE = "SENDING";
        event.pause = () => {
            event.STATE = "PAUSE";
        }
        event.stop = () => {
            event.STATE = "STOP";
        }
        return event;
    }

    /***** Token Approve */

    /**
     * approve Token from cho address
     * @param {address} spender 
     * @param {web3.eth.Contract} TokenInstance 
     * @param {address} owner
     * @param {BigNumber} amount = uint256 | "max" | "all"
     * @param {object} Setting
     * @returns {PromiEvent}
     */
    async TokenApprove(spender, TokenInstance, owner, amount = "max", Setting = this.Setting) {
        let transaction = {
            from: owner,
            gasPrice: Setting.GasPrice * 1e9
        }

        if (amount == "all")
            amount = new BigNumber(await TokenInstance.methods.getBalance(owner))
        else if (amount == "max")
            amount = new BigNumber(await TokenInstance.methods.totalSupply().call())
        transaction.gas = await TokenInstance.methods.approve(spender, amount).estimateGas(transaction);

        return TokenInstance.methods.approve(spender, amount)
            .send(transaction)
    }

    /**
     * approve Token nhiều ví 
     * @param {web3.eth.Contract} TokenInstance 
     * @param {object} transactions 
     * @param {EventEmitter} Event 
     * @param {object} Setting 
     * @param {int} index 
     */
    async TokenApproveMultiAddressesAmounts(TokenInstance, transactions, Event, Setting = this.Setting, index = 0) {
        if (index < transactions.length) {
            let spender = transactions[index].SpenderAddress
            let from = transactions[index].FromAddress
            let amount = transactions[index].Amount
            // nếu trạng thái này là dừng thì sẽ tạp hàm chạy tiếp continuous, khi muốn chạy tiếp chỉ cần gọi hàm 
            if (Event.STATE == "PAUSE") {
                Event.continuous = () => {
                    Event.STATE = "SENDING"
                    this.TokenApproveMultiAddressesAmounts(TokenInstance, transactions, Event, Setting, index)
                }
                return Event.Emit("TokenApprovePause", { spender, from, amount, TokenInstance, transactions, Event, index }, Event.continuous)
            }

            if (Event.STATE == "STOP") {
                Event.continuous = undefined;
                Event.STATE = "FINISHED";
                return Event.Emit("TokenApproveStop", { spender, from, amount, TokenInstance, transactions, Event, index })
            }

            try {
                Event.Emit("TokenApproveStart", { spender, from, amount, TokenInstance, transactions, Event, index })
                log(transactions[index])
                let r = await this.TokenApprove(spender, TokenInstance, from, amount)
                // console.info('TokenApprove', transactions[index], index, r);
                Event.Emit('TokenApproveSuccess', { ...r, spender, from, amount, TokenInstance, transactions, Event, index })
            } catch (err) {
                console.error(err)
                Event.Emit('TokenApproveError', { message: err.message, spender, from, amount, TokenInstance, transactions, Event, index })
            }
            setTimeout(() => {
                this.TokenApproveMultiAddressesAmounts(TokenInstance, transactions, Event, Setting, index + 1)
            }, Setting.TimeWait * 1000);

        } else {
            Event.STATE = "FINISHED"
            return Event.Emit("TokenApproveFinish", { TokenInstance, transactions, Event, index })
        }
    }

    /**
     * approve nhiều ví
     * @param {address} TokenAddress 
     * @param {address[]} OwnerAddresses 
     * @param {address} SpenderAddress 
     * @param {BigNumber} amounts 
     * @returns {EventEmitter}
     */
    async TokenApproveMultiAddresses(TokenAddress, OwnerAddresses = [], SpenderAddress, amounts = "max") {
        let Setting = this.Setting;
        let web3 = this.MyWeb3;

        let NameTokenAbi = await axios.get(Setting.AbiDir + Setting.NameToken.Abi).then(r => r.data)
        let TokenInstance = new web3.eth.Contract(NameTokenAbi, TokenAddress)
        const maxToken = new BigNumber(await TokenInstance.methods.totalSupply().call())

        let transactions = await Promise.all(OwnerAddresses.map(async (address, i) => ({
            FromAddress: address,
            SpenderAddress: SpenderAddress,
            Amount: amounts == "max" ? maxToken :
                amounts == "all" ? new BigNumber(await TokenInstance.methods.balanceOf(address).call()) :
                    amounts[i]
        })))

        let event = this.newEventFunctions()
        setTimeout(() => {
            this.TokenApproveMultiAddressesAmounts(TokenInstance, transactions, event, this.Setting)
        }, 100);
        return event;
    }


    /***** swap sang token */

    /**
     * Swap coin sang token, swap 1 địa chỉ, nếu Amount = "all" là swap tất cả
     * @param {web3.eth.Contract} RouterInstance
     * @param {web3.eth.Contract} TokenInstance
     * @param {address} FromAddress
     * @param {int | "all"} Amount số coin muốn swap, lưu ý là đã nhân với 10 ** 18
     * @param {address} CoinTokenAddress địa chỉ của contract coin nền tảng, ví dụ WBNB là 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
     * @param {object} Setting default = this.Setting
     * @param {Web3} web3
     * @return {PromiEvent} 
     */
    async SwapToToken(RouterInstance, TokenInstance, FromAddress, Amount = "all", CoinTokenAddress, Setting = this.Setting, web3 = this.MyWeb3) {
        let Value = new BigNumber(0)

        let Balance = new BigNumber(await web3.eth.getBalance(FromAddress));
        if (Amount == "all" || Amount.isGreaterThan(Balance.minus(Setting.GasPrice * 1e9 * Setting.GasLimit))) {
            Value = Balance.minus(Setting.GasPrice * 1e9 * Setting.GasLimit)
        } else {
            Value = Amount
        }

        log(FromAddress, Amount, CoinTokenAddress)

        if (Balance.isZero())
            throw new Error("Insufficient balance")

        // // nếu chưa approve thì approve
        // await TokenInstance.methods.allowance(FromAddress, RouterInstance.options.address).call({ from: FromAddress })
        //     .then(async r => {
        //         let a = new BigNumber(r);
        //         if (a.isZero() || Value.isGreaterThan(a)) {
        //             return await this.TokenApprove(RouterInstance.options.address, TokenInstance, FromAddress, Value);
        //         }
        //     })

        const transaction = {
            from: FromAddress,
            value: Value,
            gasPrice: Setting.GasPrice * 1e9,
        };

        let path = [CoinTokenAddress, TokenInstance.options.address]
        let AmountOut = await RouterInstance.methods.getAmountsOut(transaction.value, path).call({ from: FromAddress })
        let AmountOutMin = (new BigNumber(AmountOut[1])).multipliedBy(1 - Setting.Slippage / 100)
        AmountOutMin = (new BigNumber(AmountOutMin.toFixed(0)))

        log(AmountOutMin)

        transaction.gas = await RouterInstance.methods.swapExactETHForTokens(
            AmountOutMin,
            path,
            FromAddress,
            moment().add(5, "minutes").valueOf()).estimateGas(transaction);

        console.log("AmountOutMin", transaction, AmountOut, AmountOutMin, Setting.Slippage);

        if (Amount == "all" || Amount.isGreaterThan(Balance.minus(Setting.GasPrice * 1e9 * transaction.gas)))
            transaction.value = Balance.minus(Setting.GasPrice * 1e9 * Setting.gas) //  0.00096 * 1e18 //

        console.log("AmountOutMin", transaction, AmountOut, AmountOutMin, Setting.Slippage);

        return RouterInstance.methods.swapExactETHForTokens(
            AmountOutMin,
            path,
            FromAddress,
            moment().add(5, "minutes").valueOf())
            .send(transaction)
    }

    /**
     * tự động swap sang token với danh sách address và số lượng cần swap 
     * @param {web3.eth.Contract} RouterInstance 
     * @param {web3.eth.Contract} TokenInstance 
     * @param {address[]} addresses danh sách ví muốn swap
     * @param {float[]} Amounts danh sách số lượng swap, nếu giá trị là "all" thì swap toàn bộ trong tài khoản
     * @param {EventEmitter} Event sự kiện dùng để thông báo trạnh thái tiến trình : "SwapToTokenStart" | "SwapToTokenSuccess" | "SwapToTokenError" | "SwapToTokenPause" | "SwapToTokenFinish" | "SwapToTokenStop"
     * @param {address} CoinTokenAddress địa chỉ của conctract coin, ví dụ WETH, WBNB
     * @param {Web3} web3 instance của web3 dùng để thực hiện swap, kiểm tra số dư
     * @param {int} index vị trí bắt đầu swap trong danh sách
     * @returns 
     */
    async SwapToTokenMultiAddressesAmounts(RouterInstance, TokenInstance, addresses = [], Amounts = [], Event, CoinTokenAddress, web3 = this.MyWeb3, index = 0) {
        if (index < addresses.length) {
            // console.log(Event.STATE);
            // nếu trạng thái này là dừng thì sẽ tạp hàm chạy tiếp continuous, khi muốn chạy tiếp chỉ cần gọi hàm 
            if (Event.STATE == "PAUSE") {
                Event.continuous = () => {
                    Event.STATE = "SENDING"
                    this.SwapToTokenMultiAddressesAmounts(RouterInstance, TokenInstance, addresses, Amounts, Event, CoinTokenAddress, web3, index)
                }
                return Event.Emit("SwapToTokenPause", { RouterInstance, TokenInstance, addresses, from: addresses[index], Amounts, Event, CoinTokenAddress, web3, index }, Event.continuous)
            }
            if (Event.STATE == "STOP") {
                Event.continuous = undefined;
                Event.STATE = "FINISHED";
                return Event.Emit("SwapToTokenStop", { RouterInstance, TokenInstance, CoinTokenAddress, from: addresses[index], index, addresses, Amounts })
            }

            // bắt đầu swap
            Event.Emit("SwapToTokenStart", { RouterInstance, TokenInstance, CoinTokenAddress, index, from: addresses[index], Amount: Amounts[index] })
            try {
                let receipt = await this.SwapToToken(RouterInstance, TokenInstance, addresses[index], Amounts[index], CoinTokenAddress, this.Setting, web3)
                Event.Emit("SwapToTokenSuccess", { ...receipt, index, addresses, Amounts })

            } catch (err) {
                console.error(err);
                Event.Emit("SwapToTokenError", { message: err.toString(), from: addresses[index], index, addresses, Amounts })
            }
            // đệ quy
            setTimeout(() => {
                this.SwapToTokenMultiAddressesAmounts(RouterInstance, TokenInstance, addresses, Amounts, Event, CoinTokenAddress, web3, index + 1)
            }, this.Setting.TimeWait * 1000);
        } else {
            Event.STATE = "FINISHED"
            Event.Emit("SwapToTokenFinish", { RouterInstance, TokenInstance, CoinTokenAddress, index, addresses, Amounts })
        }
    }

    /**
     * tự động swap nhiều ví từ coin sang token, hàm này dùng để khởi tạo danh sách ví, số lượng, instance của các contract, rồi mới gửi qua hàm swap tổng quát SwapToTokenMultiAddressesAmounts
     * @param {web3.eth.Contract | address} TokenInstance 
     * @param {address[]} addresses 
     * @param {int[]} Amounts 
     * @return {EventEmitter}
     */
    async SwapToTokenMultiAddresses(TokenAddress, addresses = [], Amounts = "all") {
        let web3 = this.MyWeb3
        let Setting = this.Setting

        let NameTokenAbi = await axios.get(Setting.AbiDir + Setting.NameToken.Abi).then(r => r.data)
        let TokenInstance = new web3.eth.Contract(NameTokenAbi, TokenAddress)

        let RouterAbi = await axios.get(Setting.AbiDir + Setting.Router.Abi).then(r => r.data)
        let RouterInstance = new web3.eth.Contract(RouterAbi, Setting.Router.Address)

        let CoinTokenAddress
        try {
            CoinTokenAddress = await RouterInstance.methods.WETH().call()
        } catch (err) {
            throw new Error("Router is not exist")
        }

        if (Amounts == "all") Amounts = addresses.map(v => "all")
        let event = this.newEventFunctions();
        setTimeout(() => {
            this.SwapToTokenMultiAddressesAmounts(RouterInstance, TokenInstance, addresses, Amounts, event, CoinTokenAddress, web3);
        }, 100);
        return event;
    }


    /***** swap sang coin */

    /**
     * Swap sang coin, swap 1 địa chỉ, nếu Amount = "all" là swap tất cả
     * @param {web3.eth.Contract} RouterInstance
     * @param {web3.eth.Contract} TokenInstance
     * @param {address} FromAddress
     * @param {BigNumber | "all"} Amount số token muốn swap, lưu ý là đã nhân với 10 ** decimals
     * @param {address} CoinTokenAddress địa chỉ của contract coin nền tảng, ví dụ WBNB là 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
     * @param {object} Setting default = this.Setting
     * @param {Web3} web3
     * @return {PromiEvent} 
     */
    async SwapToCoin(RouterInstance, poolAddress, TokenInstance, FromAddress, Amount = "all", CoinTokenAddress, Setting = this.Setting, web3 = this.MyWeb3) {
        let Value = new BigNumber(0);

        let Balance = new BigNumber(await TokenInstance.methods.balanceOf(FromAddress).call());

        if (Amount == "all" || Amount.isGreaterThan(Balance)) {
            Value = Balance
        } else {
            Value = Amount
        }

        if (Balance.isZero())
            throw new Error("Insufficient balance")

        // nếu chưa approve thì approve
        log(RouterInstance.options)
        await TokenInstance.methods.allowance(FromAddress, RouterInstance.options.address).call({ from: FromAddress })
            .then(async r => {
                let a = new BigNumber(r);
                if (a.isZero() || Value.isGreaterThan(a)) {
                    return await this.TokenApprove(RouterInstance.options.address, TokenInstance, FromAddress, Value);
                }
            })

        const transaction = {
            from: FromAddress,
            gasPrice: Setting.GasPrice * 1e9,
        };
        console.log("AmountOutMin", transaction, Value, poolAddress);

        let path = [TokenInstance.options.address, CoinTokenAddress]
        let AmountOut = await RouterInstance.methods.getAmountsOut(Value, path).call({ from: FromAddress })
        let AmountOutMin = (new BigNumber(AmountOut[1])).multipliedBy(1 - Setting.Slippage / 100)
        AmountOutMin = (new BigNumber(AmountOutMin.toFixed(0)))

        console.log("AmountOutMin", Value, AmountOut, AmountOutMin, Setting.Slippage);

        transaction.gas = await RouterInstance.methods.swapExactTokensForETH(
            Value,
            AmountOutMin,
            path,
            FromAddress,
            moment().add(5, "minutes").valueOf()).estimateGas(transaction);


        console.log("AmountOutMin", transaction, AmountOut, AmountOutMin, Setting.Slippage);

        return RouterInstance.methods.swapExactTokensForETH(
            Value,
            AmountOutMin,
            path,
            FromAddress,
            moment().add(5, "minutes").valueOf())
            .send(transaction)
    }

    /**
     * tự động swap sang coin với danh sách address và số lượng cần swap 
     * @param {web3.eth.Contract} RouterInstance 
     * @param {web3.eth.Contract} TokenInstance 
     * @param {address[]} addresses danh sách ví muốn swap
     * @param {float[]} Amounts danh sách số lượng swap, nếu giá trị là "all" thì swap toàn bộ trong tài khoản
     * @param {EventEmitter} Event sự kiện dùng để thông báo trạnh thái tiến trình 
     * : "SwapToCoinStart" | "SwapToCoinSuccess" | "SwapToCoinError" | "SwapToCoinPause" | "SwapToCoinFinish" | "SwapToCoinStop"
     * @param {address} CoinTokenAddress địa chỉ của conctract coin, ví dụ WETH, WBNB
     * @param {Web3} web3 instance của web3 dùng để thực hiện swap, kiểm tra số dư
     * @param {int} index vị trí bắt đầu swap trong danh sách
     * @returns 
     */
    async SwapToCoinMultiAddressesAmounts(RouterInstance, poolAddress, TokenInstance, addresses = [], Amounts = [], Event, CoinTokenAddress, web3 = this.MyWeb3, index = 0) {
        if (index < addresses.length) {
            // console.log(Event.STATE);
            // nếu trạng thái này là dừng thì sẽ tạp hàm chạy tiếp continuous, khi muốn chạy tiếp chỉ cần gọi hàm 
            if (Event.STATE == "PAUSE") {
                Event.continuous = () => {
                    Event.STATE = "SENDING"
                    this.SwapToCoinMultiAddressesAmounts(RouterInstance, poolAddress, TokenInstance, addresses, Amounts, Event, CoinTokenAddress, web3, index)
                }
                return Event.Emit("SwapToCoinPause", { RouterInstance, TokenInstance, addresses, from: addresses[index], Amounts, Event, CoinTokenAddress, web3, index }, Event.continuous)
            }
            if (Event.STATE == "STOP") {
                Event.continuous = undefined;
                Event.STATE = "FINISHED";
                return Event.Emit("SwapToCoinStop", { RouterInstance, TokenInstance, CoinTokenAddress, from: addresses[index], index, addresses, Amounts })
            }

            // bắt đầu swap
            Event.Emit("SwapToCoinStart", { RouterInstance, TokenInstance, CoinTokenAddress, index, from: addresses[index], Amount: Amounts[index] })
            try {
                let receipt = await this.SwapToCoin(RouterInstance, poolAddress, TokenInstance, addresses[index], Amounts[index], CoinTokenAddress, this.Setting, web3)
                Event.Emit("SwapToCoinSuccess", { ...receipt, index, addresses, Amounts })

            } catch (err) {
                console.error(err);
                Event.Emit("SwapToCoinError", { message: err.toString(), from: addresses[index], index, addresses, Amounts })
            }

            // đệ quy
            setTimeout(() => {
                this.SwapToCoinMultiAddressesAmounts(RouterInstance, poolAddress, TokenInstance, addresses, Amounts, Event, CoinTokenAddress, web3, index + 1)
            }, this.Setting.TimeWait * 1000);
        } else {
            Event.STATE = "FINISHED"
            Event.Emit("SwapToCoinFinish", { RouterInstance, TokenInstance, CoinTokenAddress, index, addresses, Amounts })
        }
    }

    /**
     * tự động swap nhiều ví từ token sang coin, hàm này dùng để khởi tạo danh sách ví, số lượng, instance của các contract, rồi mới gửi qua hàm swap tổng quát SwapToCoinMultiAddressesAmounts
     * @param {web3.eth.Contract | address} TokenInstance 
     * @param {address[]} addresses 
     * @param {int[]} Amounts 
     * @return {EventEmitter}
     */
    async SwapToCoinMultiAddresses(TokenAddress, addresses = [], Amounts = "all") {
        let web3 = this.MyWeb3
        let Setting = this.Setting
        
        let NameTokenAbi = await axios.get(Setting.AbiDir + Setting.NameToken.Abi).then(r => r.data)
        let TokenInstance = new web3.eth.Contract(NameTokenAbi, TokenAddress)

        let RouterAbi = await axios.get(Setting.AbiDir + Setting.Router.Abi).then(r => r.data)
        let RouterInstance = new web3.eth.Contract(RouterAbi, Setting.Router.Address)
        let FactoryAddress
        try {
            FactoryAddress = await RouterInstance.methods.factory().call()
        } catch (err) {
            throw new Error("Router is not exist")
        }

        let FactoryAbi = await axios.get(Setting.AbiDir + Setting.Factory.Abi).then(r => r.data)
        let FactoryInstance = new web3.eth.Contract(FactoryAbi, FactoryAddress)
        let poolAddress
        try {
            poolAddress = await FactoryInstance.methods.getPair(await RouterInstance.methods.WETH().call(), TokenAddress).call()
        } catch (err) {
            throw new Error("Factory is not exist")
        }

        let CoinTokenAddress = await RouterInstance.methods.WETH().call()

        if (Amounts == "all") Amounts = addresses.map(v => "all")

        let event = this.newEventFunctions();
        setTimeout(() => {
            this.SwapToCoinMultiAddressesAmounts(RouterInstance, poolAddress, TokenInstance, addresses, Amounts, event, CoinTokenAddress, web3);
        }, 100);
        return event;
    }




    /***** gửi coin */

    /**
     * gửi coin từ nhiều ví tới các ví, với nhiều số lượng khác nhau
     * transaction
     * @param {Web3} web3 
     * @param {array[]} transactions = [{ FromAddress, ToAddress , Amount: BigNumber  }]
     * Amount == all là gửi hết tiền
     * @param {EventEmitter} Event = sendCoinStart | sendCoinPause | sendCoinStoped | sendCoinError | sendCoinSuccess | sendCoinFinish
     * @param {int} index 
     */
    async SendCoinMultiTransactions(web3, transactions = [], Event, Setting, index = 0) {
        if (index < transactions.length) {
            let tx = transactions[index]
            if (tx.FromAddress != tx.ToAddress) {
                let Value = new BigNumber(0)
                let Balance = new BigNumber(await web3.eth.getBalance(tx.FromAddress))
                if (tx.Amount == "all" || tx.Amount.isGreaterThanOrEqualTo(Balance.minus(Setting.GasPrice * 1e9 * Setting.GasLimit))) {
                    Value = Balance.minus(Setting.GasPrice * 1e9 * Setting.GasLimit)
                } else {
                    Value = tx.Amount
                }

                const transaction = {
                    from: tx.FromAddress,
                    to: tx.ToAddress,
                    value: Value,
                    gasPrice: Setting.GasPrice * 1e9,
                };

                try {
                    if (Balance.isZero())
                        throw new Error("Insufficient balance")
                    // console.log(Event.STATE);
                    // nếu trạng thái này là dừng thì sẽ tạp hàm chạy tiếp continuous, khi muốn chạy tiếp chỉ cần gọi hàm 
                    if (Event.STATE == "PAUSE") {
                        Event.continuous = () => {
                            Event.STATE = "SENDING"
                            this.SendCoinMultiTransactions(web3, transactions, Event, Setting, index)
                        }
                        return Event.Emit("sendCoinPause", { web3, ...transaction, transactions, Event, Setting, index }, Event.continuous)
                    }
                    if (Event.STATE == "STOP") {
                        Event.continuous = undefined;
                        Event.STATE = "FINISHED";
                        return Event.Emit("sendCoinStoped", { web3, ...transaction, transactions, Event, Setting, index })
                    }
                    // thông báo sự kiện bắt đầu gửi coin
                    Event.Emit("sendCoinStart", { ...transaction, index: index, Amount: tx.Amount, web3: web3, transactions })

                    console.log(Setting.GasPrice, Setting.Gas);

                    transaction.gas = new BigNumber(await web3.eth.estimateGas(transaction))

                    if (tx.Amount == "all" || tx.Amount.isGreaterThan(Balance))
                        transaction.value = Balance.minus(transaction.gas.multipliedBy(transaction.gasPrice)) // 0.00096 * 1e18 // 

                    console.log(index, tx.Amount, transaction);

                    if (transaction.value <= 0)
                        throw new Error("0 value")

                    await web3.eth.sendTransaction(transaction)
                        // .on('transactionHash', function (hash) { })
                        .on('receipt', function (receipt) {
                            console.log(index + 1, 'Sent: ', tx.Amount, tx.FromAddress, '->', tx.ToAddress)
                            Event.Emit("sendCoinSuccess", { ...receipt, index: index, Amount: tx.Amount, web3: web3, transactions })
                        })
                    // Event.Emit("sendCoinSuccess", { ...transaction, index: index, Amount: tx.Amount, web3: web3, transactions })
                } catch (err) {
                    console.error(index, transaction.to, err);
                    Event.Emit("sendCoinError", { message: err.message, ...transaction, index: index, Amount: tx.Amount, web3: web3, transactions })
                }
            }
            // loop
            setTimeout(() => this.SendCoinMultiTransactions(web3, transactions, Event, Setting, index + 1), Setting.TimeWait * 1000)

        } else {
            Event.STATE = "FINISHED"
            return Event.Emit("sendCoinFinish", { web3, transactions, Event, Setting, index })
        }
    }

    /**
     * gửi coin từ 1 ví tới nhiều ví, nhiều số lượng
     * @param {address} FromAddress 
     * @param {address[]} ToAddresses 
     * @param {float[]} amounts 
     * @returns {EventEmitter}
     */
    sendCoin1ToMultiAmounts(FromAddress, ToAddresses = [], amounts = []) {
        let transactions = ToAddresses.map((v, i) => ({
            FromAddress: FromAddress, ToAddress: v, Amount: amounts[i]
        }))
        let event = this.newEventFunctions()
        setTimeout(() => {
            this.SendCoinMultiTransactions(this.MyWeb3, transactions, event, this.Setting)
        }, 100);
        return event;
    }

    /**
     * gửi coin từ nhiều ví tới 1 ví, nhiều số lượng
     * @param {address[]} FromAddresses
     * @param {address} ToAddress
     * @param {float[]} amounts 
     * @returns {EventEmitter}
     */
    sendCoinMultiTo1Amounts(FromAddresses = [], ToAddress, amounts = "all") {
        let transactions = FromAddresses.map((v, i) => ({
            FromAddress: v, ToAddress: ToAddress, Amount: amounts == "all" ? "all" : amounts[i]
        }))
        let event = this.newEventFunctions()
        setTimeout(() => {
            this.SendCoinMultiTransactions(this.MyWeb3, transactions, event, this.Setting)
        }, 100);
        return event;
    }



    /***** gửi token */

    /**
     * gửi token từ nhiều ví tới các ví, với nhiều số lượng khác nhau
     * transaction
     * @param {web3.eth.Contract} TokenInstance 
     * @param {array[]} transactions = [{ FromAddress, ToAddress , Amount  }]
     * Amount == all là gửi hết tiền
     * @param {EventEmitter} Event = sendTokenStart | sendTokenPause | sendTokenStoped | sendTokenError | sendTokenSuccess | sendTokenFinish
     * @param {int} index 
     */
    async SendTokenMultiTransactions(TokenInstance, transactions = [], Event, Setting, index = 0) {
        if (index < transactions.length) {
            let tx = transactions[index]
            if (tx.FromAddress != tx.ToAddress) {
                let Amount = new BigNumber(0)
                let Balance = new BigNumber(await TokenInstance.methods.balanceOf(tx.FromAddress).call());

                if (tx.Amount == "all" || tx.Amount.isGreaterThan(Balance)) {
                    Amount = Balance
                } else {
                    Amount = tx.Amount
                }

                const transaction = {
                    from: tx.FromAddress,
                    to: tx.ToAddress,
                    gasPrice: Setting.GasPrice * 1e9,
                };

                try {
                    console.log(tx, Amount, Balance);
                    if (Balance.isZero())
                        throw new Error("Insufficient balance")
                    // console.log(Event.STATE);
                    // nếu trạng thái này là dừng thì sẽ tạp hàm chạy tiếp continuous, khi muốn chạy tiếp chỉ cần gọi hàm 
                    if (Event.STATE == "PAUSE") {
                        Event.continuous = () => {
                            Event.STATE = "SENDING"
                            this.SendTokenMultiTransactions(TokenInstance, transactions, Event, Setting, index)
                        }
                        return Event.Emit("sendTokenPause", { TokenInstance, ...transaction, transactions, Event, Setting, index }, Event.continuous)
                    }
                    if (Event.STATE == "STOP") {
                        Event.continuous = undefined;
                        Event.STATE = "FINISHED";
                        return Event.Emit("sendTokenStoped", { TokenInstance, ...transaction, transactions, Event, Setting, index })
                    }
                    // thông báo sự kiện bắt đầu gửi coin
                    Event.Emit("sendTokenStart", { ...transaction, index: index, Amount: tx.Amount, transactions })

                    transaction.gas = await TokenInstance.methods.transfer(tx.ToAddress, Amount).estimateGas(transaction) || Setting.Gas

                    console.warn(Amount);

                    await TokenInstance.methods.transfer(tx.ToAddress, Amount).send(transaction)
                        // .on('transactionHash', function (hash) { })
                        .on('receipt', function (receipt) {
                            console.log(index + 1, 'Sent: ', tx.Amount, tx.FromAddress, '->', tx.ToAddress, receipt)
                            Event.Emit("sendTokenSuccess", { ...receipt, to: tx.ToAddress, index: index, Amount: tx.Amount, transactions })
                        })
                        .on('error', function (err, receipt) {
                            console.error(index, transaction, err, receipt);
                            Event.Emit("sendTokenError", { message: err.message, ...transaction, index: index, ...tx, TokenInstance, transactions })
                        });
                } catch (err) {
                    console.error(index, transaction.to, err);
                    Event.Emit("sendTokenError", { message: err.message, ...transaction, index: index, ...tx, TokenInstance, transactions })
                }
            }
            // loop
            setTimeout(() => this.SendTokenMultiTransactions(TokenInstance, transactions, Event, Setting, index + 1), Setting.TimeWait * 1000)

        } else {
            Event.STATE = "FINISHED"
            return Event.Emit("sendTokenFinish", { TokenInstance, transactions, Event, Setting, index })
        }
    }

    /**
     * gửi token từ 1 ví tới nhiều ví, nhiều số lượng
     * @param {address} FromAddress 
     * @param {address[]} ToAddresses 
     * @param {float[]} amounts 
     * @returns {EventEmitter}
     */
    async SendToken1ToMultiAmounts(TokenAddress, FromAddress, ToAddresses = [], amounts = []) {
        let Setting = this.Setting;
        let web3 = this.MyWeb3;

        let NameTokenAbi = await axios.get(Setting.AbiDir + Setting.NameToken.Abi).then(r => r.data)
        let TokenInstance = new web3.eth.Contract(NameTokenAbi, TokenAddress)

        let transactions = await ToAddresses.map((v, i) => ({
            FromAddress: FromAddress, ToAddress: v, Amount: amounts[i]
        }))

        let event = this.newEventFunctions()
        setTimeout(() => {
            this.SendTokenMultiTransactions(TokenInstance, transactions, event, Setting)
        }, 100);
        return event;
    }

    /**
     * gửi token từ nhiều ví tới 1 ví, nhiều số lượng
     * @param {address[]} FromAddresses
     * @param {address} ToAddress
     * @param {float[]} amounts 
     * @returns {EventEmitter}
     */
    async SendTokenMultiTo1Amounts(TokenAddress, FromAddresses = [], ToAddress, amounts = "all") {
        let Setting = this.Setting;
        let web3 = this.MyWeb3;

        let NameTokenAbi = await axios.get(Setting.AbiDir + Setting.NameToken.Abi).then(r => r.data)
        let TokenInstance = new web3.eth.Contract(NameTokenAbi, TokenAddress)

        let transactions = FromAddresses.map((v, i) => ({
            FromAddress: v, ToAddress: ToAddress, Amount: amounts == "all" ? "all" : amounts[i]
        }))

        let event = this.newEventFunctions()
        setTimeout(() => {
            console.log(transactions);
            this.SendTokenMultiTransactions(TokenInstance, transactions, event, this.Setting)
        }, 100);
        return event;
    }
}

export default AutoSwapTransfers;