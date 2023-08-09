import React from "react"
import { connect } from 'react-redux';
import { getShortAddress } from "../../std"
import { toast } from 'react-toastify';
import { connectWeb3, CHAINS, switchChain } from "../../store/Web3";
import Wallet from "../Wallet";

import { Alert, Button, Form, InputGroup, Table } from "react-bootstrap";
import { withTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import BtnCopy from "../BtnCopy";

import { addContract, balanceOf, getInfoAll, remove } from "../../store/Tokens";

const { log, warn, error } = console


class TokensSelect extends React.Component {
    state = {
        CHAIN: CHAINS[56],
        mainWallet: null
    }

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let { web3, tokens, t, setting, getInfoAll } = this.props
        // if (!tokens &&!this.state.addingContract ) this.getTokenList(web3);
    }

    componentDidUpdate(prevProps) {
        (async () => {
            let { web3, tokens, t, mainWallet, getInfoAll } = this.props
            let { CHAIN } = this.state;

            if (prevProps.web3 != web3) {
                await this.getChainId(web3)
            }
        })()
    }

    getChainId(web3) {
        let { t, getInfoAll } = this.props;
        let { CHAIN } = this.state;
        return web3.eth.getChainId().then(chainId => {
            if (CHAIN.id != chainId) {
                if (CHAINS[chainId])
                    this.setState({ CHAIN: CHAINS[chainId] })
                else toast.error(t("Chain not found") + ": " + chainId)
            }
            return chainId
        }).catch(err => {
            console.error(err)
        })
    }

    tokensSelected(e) {
        this.props.onTokenChange(e.target.value)
    }

    render() {
        let { web3, tokens, t, value } = this.props
        let { newTokenAddress, CHAIN, addingContract, mainWallet } = this.state;
        // log(tokens)
        // if (web3) log(web3.currentProvider.host);

        return web3 ?
            (
                <Form.Select aria-label="Tokens" onChange={this.tokensSelected.bind(this)} value={value}>
                    {Object.keys(tokens).map(tokenAddress => (
                        <option value={tokenAddress} key={tokenAddress}>
                            {tokens[tokenAddress]?.symbol} - {tokens[tokenAddress]?.name} - {getShortAddress(tokenAddress, 2)}
                        </option>
                    ))}
                </Form.Select>
            ) : (
                <Alert variant={"danger"}>
                    {t("No web3, please install the correct RPC")}
                </Alert>
            )
    }
}

const mapStateToProps = (state, ownProps) => ({
    web3: state.MyWeb3.web3,
    wallets: state.Wallets.wallets,
    mainWallet: state.Wallets.mainWallet,
    tokens: state.Tokens,
    setting: state.Settings.setting
});

export default connect(mapStateToProps, {
    addContract: addContract,
    getInfoAll: getInfoAll,
    remove: remove,
})(withTranslation()(TokensSelect));
