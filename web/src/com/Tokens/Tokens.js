import React from "react"
import { connect } from 'react-redux';
import { decryptString } from "../../std"
import { toast } from 'react-toastify';
import Web3, { CHAINS, } from "../../store/Web3";
import { event as MyWeb3Event } from "../../store/MyWeb3";

import { Alert, Button, Form, InputGroup, Table } from "react-bootstrap";
import { withTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import BtnCopy from "../BtnCopy";

import { addContract, balanceOf, getInfoAll, remove, setTokens } from "../../store/Tokens";
import { WalletsEvent } from "../../store/Wallets";
import { SettingsEvent, saveSetting } from "../../store/Settings";

const { log, warn, error } = console

var Tokenscount = 0
class Tokens extends React.Component {
    state = {
        newTokenAddress: "0x2566d2dfdeEBBC63d1dD070d462901A535570D21",
        addingContract: false,
        mainWallet: null
    }

    constructor(props) {
        super(props)
        this.addToken.bind(this)
        this.pasteNewToken.bind(this)
        this.changeDefaultToken.bind(this)
    }

    componentDidMount() {
        let { web3, t, mainWallet, setting, getInfoAll, setTokens, } = this.props
        // if (!tokens &&!this.state.addingContract ) this.getTokenList(web3);
        // setTokens(setting.tokens.reduce((tokens, t) => { tokens[t] = null; return tokens }, {}))

        SettingsEvent.on("loaded", ({ after }) => {
            // nếu NameToken ko có trong danh sách thì gán tokens 0 cho NameToken
            if (after.tokens.length > 0 && !after.tokens.includes(after.NameToken.Address))
                this.props.saveSetting({ key: "NameToken.Address", value: after.tokens[0] }).then(log)

            // nếu web3 chưa có thì gán setting.tokens vào biến tokens
            setTokens(after.tokens.reduce((tokens, t) => { tokens[t] = null; return tokens }, {}))

        })

        WalletsEvent.on("mainWalletChanged", async mainWallet => {
            // tính số dư của mainWallet
            if (mainWallet?.privateKey)
                balanceOf(Object.values(this.props.tokens).filter(v => v), mainWallet.address).then(r => {
                    this.setState({ mainWallet: { ...this.props.mainWallet, ...r } })
                });
        })

        MyWeb3Event.on("connected", ({ web3, accounts, chainId }) => {
            // log(chainId, this.props.web3?.currentProvider?.host || this.props.web3?.currentProvider?.url)
            getInfoAll().then((r) => {
                if (this.props.mainWallet?.privateKey) {
                    balanceOf(
                        Object.values(this.props.tokens).filter(v => v),
                        this.props.mainWallet.address).then(r => {
                            // log('WalletsEvent.on("mainWalletChanged"', Object.values(this.props.tokens).filter(v => v))
                            this.setState({ mainWallet: { ...this.props.mainWallet, ...r } })
                        });
                }
            })
        })
    }

    componentDidUpdate(preProps) {
        let { web3, tokens, t, mainWallet, setting, getInfoAll, setTokens, } = this.props
        let preurl = preProps.web3?.currentProvider?.host || preProps.web3?.currentProvider?.url
        let url = web3?.currentProvider?.host || web3?.currentProvider?.url

        if (web3 && preurl != url) {
            getInfoAll().then(r => {
                if (r.error)
                    console.error(r.error)
            })
        }
    }

    async addToken(e) {
        e.preventDefault()
        e.stopPropagation()

        let { t, web3, addContract, } = this.props;
        let { newTokenAddress } = this.state;

        if (!web3.utils.isAddress(newTokenAddress))
            return toast.error(newTokenAddress + ": " + t("WRONG_ADDRESS_FORMAT"))

        try {
            this.setState({ addingContract: true })
            let r = await addContract({ address: newTokenAddress })
            if (r.error) {
                console.error(r.error)
                if (r.error.message == "Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.")
                    toast.error(newTokenAddress + ": \n" + t("Contract is not exist") + ". \n" +
                        t("Please check address or blockchain"), { autoClose: 10000, })
                else {
                    toast.error(r.error.message)
                    error(r.error.message)
                }
            }
        } catch (err) {
            error(err)
        }
        this.setState({ addingContract: false })
    }

    pasteNewToken() {
        let { t, web3 } = this.props;
        navigator.clipboard.readText()
            .then(v => {
                let TokenAddress = v.trim()
                if (web3.utils.isAddress(TokenAddress)) {
                    this.setState({ newTokenAddress: TokenAddress })
                } else toast.error(TokenAddress + ": " + t("WRONG_ADDRESS_FORMAT"))
            })
    }

    remove(address) {
        let { remove } = this.props;
        remove(address)
    }

    changeDefaultToken(e) {
        let { saveSetting } = this.props;
        saveSetting({ key: "NameToken.Address", value: e.target.value })
    }

    render() {
        let { web3, tokens, CHAIN, t, setting, } = this.props
        let { newTokenAddress, addingContract, mainWallet } = this.state;

        // if (web3) log(web3.currentProvider);
        // log(tokens, setting.tokens)
        return (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>{t("Default")}</th>
                        <th>{Object.keys(tokens).length}/{setting?.tokens?.length} {t("Address")}</th>
                        <th>{t("Name")}</th>
                        <th>{t("Symbol")}</th>
                        <th>{t("Decimals")}</th>
                        <th>{t("Total Supply")}</th>
                        <th>{t("Balance")}</th>
                        <th>{t("Remove")} <FontAwesomeIcon icon="fa-trash" /></th>
                    </tr>
                </thead>

                <tbody>
                    {Object.entries(tokens).map(([address, info], i) => (
                        <tr key={address}>
                            <td style={{ textAlign: "center" }}>
                                <Form.Check
                                    type="radio"
                                    name="default"
                                    value={address}
                                    onChange={this.changeDefaultToken.bind(this)}
                                    checked={address == setting.NameToken.Address}
                                />
                            </td>
                            <td>
                                <a href={CHAIN?.blockExplorerUrls + "token/" + address + "#code"} target="_blank"> {address}</a>
                                <BtnCopy value={address} /></td>
                            <td>{info?.name} <BtnCopy value={info?.name} /></td>
                            <td>{info?.symbol} <BtnCopy value={info?.symbol} /></td>
                            <td>{info?.decimals?.e} <BtnCopy value={info?.decimals?.e} /></td>
                            <td>{info?.totalSupply?.div(info.decimals).toFormat(0)} <BtnCopy value={info?.totalSupply?.div(info.decimals)} /></td>

                            <td>{mainWallet && mainWallet[address] ? (mainWallet[address].div(info?.decimals).toFormat()) : ""}</td>

                            <td>
                                <FontAwesomeIcon icon="fa-trash" onClick={e => this.remove.bind(this)(address)} style={{ cursor: "pointer" }} />
                            </td>
                        </tr>
                    ))}

                    <tr>
                        <td>
                        </td>
                        <td>
                            <Form onSubmit={this.addToken.bind(this)}>
                                <InputGroup>
                                    <Form.Control type="text" name="Address" value={newTokenAddress}
                                        onChange={e => this.setState({ newTokenAddress: e.target.value })}
                                        isInvalid={!web3?.utils?.isAddress(newTokenAddress)} />
                                    <Button onClick={this.pasteNewToken.bind(this)} variant="outline-secondary" >{t("Paste")} <FontAwesomeIcon icon="fa-clipboard" /></Button>
                                    <BtnCopy value={newTokenAddress} /> &nbsp;
                                    <Button type="submit" variant="success" >{t("Add")} <FontAwesomeIcon icon="fa-plus" disabled={addingContract} /></Button>
                                    <Form.Control.Feedback type="invalid">
                                        {t("WRONG_ADDRESS_FORMAT")}
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form>
                        </td>
                    </tr>
                </tbody>
            </Table >
        )
        // (
        //     <Alert variant={"danger"}>
        //         {t("No web3, please install the correct RPC")}
        //     </Alert>
        // )
    }
}

const mapStateToProps = (state, ownProps) => ({
    web3: state.MyWeb3.web3,
    CHAIN: state.MyWeb3.CHAIN,
    wallets: state.Wallets.wallets,
    mainWallet: state.Wallets.mainWallet,
    tokens: state.Tokens,
    setting: state.Settings.setting
});

export default connect(mapStateToProps, {
    addContract: addContract,
    getInfoAll: getInfoAll,
    remove: remove,
    setTokens: setTokens,
    saveSetting: saveSetting,
})(withTranslation()(Tokens));
