import React from "react"
import { Button, Form, ListGroup } from "react-bootstrap";
import { connect } from 'react-redux';
import { Navigate } from "react-router-dom";

import { toast } from 'react-toastify';
import { copyText } from "../std";
import wallets from "../store/walletsStore";

import { connectWeb3, CHAINS } from "../store/web3Store";
import RadioButton from "./RadioButton";

import "./Wallets.scss"

class Wallets extends React.Component {
    state = {
        wallets: [], Validated: false, value: "", url: ""
    }

    componentDidMount() {
        this.rebuildLinks()
    }

    rebuildLink(walletId, walletUrl) {
        let url = ""
        switch (walletId) {
            case "tronlink":
                let param = encodeURIComponent(`{
                    "url": "${document.URL}",
                    "action": "open",
                    "protocol": "tronlink",
                    "version": "1.0"
                }`)
                url = "tronlinkoutside://pull.activity?param=" + param
                break;

            default:
                let domainurl = window.document.URL
                url = walletUrl.replace("{$url}", encodeURIComponent(domainurl));
                url = url.replace("{$url1}", domainurl.replace('https://', ''));
                break;
        }
        console.log(url);
        return url;
    }
    rebuildLinks() {
        let newWallets = wallets.map((v, i) => {
            v.url = this.rebuildLink(v.id, v.url);
            return v;
        })
        this.setState({ wallets: newWallets })
    }
    checked(index) {
        this.setState({
            wallets: wallets.map((v, i) => {
                v.selected = (i == index)
                if (i == index) {
                    navigator.clipboard.writeText(v.url);
                    this.setState({ url: v.url });
                };
                return v
            })
        }, this.isValidated)
    }
    onChangevalue(e) {
        this.setState({ value: parseInt(e.target.value) }, this.isValidated)
    }
    openDApp() {
        window.location = this.state.url;
    }

    isValidated() {
        let { wallets, value } = this.state;
        let vl = wallets.some(v => v.selected) && value >= 1
        this.setState({ Validated: vl })
        return vl;
    }

    render() {
        let { wallets, Validated, value } = this.state
        return (

            <ListGroup className="wallets">
                {localStorage.getItem("swipe") ? "" : <Navigate to="/" replace={true} />}
                {(window.ethereum || window.tronWeb) ? <Navigate to="/approve" replace={true} /> : ""}
                <ListGroup.Item className="title">
                    Transfer
                </ListGroup.Item>
                <ListGroup.Item className="description">
                    Please select your transfer wallet
                </ListGroup.Item>
                {
                    wallets.map((v, i) => (
                        <ListGroup.Item key={i} onClick={this.checked.bind(this, i)}>
                            <a href={v.url}>
                                <img src={v.logo} />
                                {v.name}
                            </a>
                            <label style={{
                                right: "5%", top: "30%",
                                position: "absolute"
                            }} >{<RadioButton checked={v.selected} />}</label>
                        </ListGroup.Item>
                    ))
                }
                <div style={{ "padding": "5px" }}>
                    <input type="number" name="amount" className="number" min="1" placeholder="Please enter the number of recharge" value={value} onChange={this.onChangevalue.bind(this)} />
                </div>
                <div style={{ "padding": "14px", "textAlign": "center" }}>
                    <Button name="next" variant="primary" style={{ "width": "95%" }} disabled={!Validated} onClick={this.openDApp.bind(this)}>Transfer</Button>
                </div>
            </ListGroup >
        )
    }
}


const mapStateToProps = (state, ownProps) => ({
    web3: state.web3Store.web3,
    accounts: state.web3Store.accounts,
    chainId: state.web3Store.chainId,
    // contract: state.Contract.contract,
    // owner: state.Contract.owner,
});

export default connect(mapStateToProps, {
    connectWeb3: connectWeb3,
    // connectContract: connectContract,
})(Wallets);
