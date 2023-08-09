import React from "react"
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import { connectWeb3, CHAINS, switchChain } from "../store/Web3";
import { Container, Button, Form } from "react-bootstrap";
import BtnCopy from "./BtnCopy";
import SHA256 from "crypto-js/sha256";


class Tools extends React.Component {
    state = {
        isConnectedWeb3: false, abiFolder: "contracts/", fileSettings: "settings.json",
        deadline: (Date.now() + 6e5 * 10).toString(),
        EthValue: 1, EthValueWei: "", EthValueWeiHex: ""
    }
    constructor(props) {
        super(props);
        this.AutoHash.bind(this)
        this.copy.bind(this)
    }

    componentDidMount() {
        let { EthValue } = this.state;
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            this.setState({ isConnectedWeb3: false })
        }
        console.log("0x" + SHA256("Message").toString());

        setTimeout(() => {
            this.AutoHash()
            this.setState({ EthValue: EthValue, EthValueWei: Number(EthValue) * 1e18, EthValueWeiHex: "0x" + (Number(EthValue) * 1e18).toString(16) })
        }, 500);
    }

    AutoHash(e, value) {
        if (!value) {
            let deadline = (Date.now() + 6e5 * 10).toString()
            this.setState({ deadline: deadline, deadlineHash: "0x" + SHA256(deadline).toString() })
        }
    }

    onDeadlineChange(e) {
        let deadline = e.target.value
        this.setState({ deadline: deadline, deadlineHash: "0x" + SHA256(deadline).toString() })
    }

    EthToWei(e) {
        let value = e.target.value;
        this.setState({ EthValue: value, EthValueWei: Number(value) * 1e18, EthValueWeiHex: "0x" + (Number(value) * 1e18).toString(16) })
    }

    copy(e) {
        // toast.success("Copied", { duration: 500, });
        return navigator.clipboard.writeText(e.target.value)
    }

    render() {
        let { symbol, deadline, deadlineHash, EthValue, EthValueWei, EthValueWeiHex } = this.state;
        let { web3, chainId } = this.props;
        return (
            <Container>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="deadline">10 Minutes later</Form.Label> <Button onClick={this.AutoHash.bind(this)}>🔄</Button>
                        <Form.Control id="deadline" value={deadline} onFocus={this.copy} onChange={this.onDeadlineChange.bind(this)} type="number" />
                        <Form.Control id="deadline" value={deadlineHash} onFocus={this.copy} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="EthValue">ETH to WEI</Form.Label>
                        <Form.Control id="EthValue" value={EthValue} onFocus={this.copy} onChange={this.EthToWei.bind(this)} type="number" />
                        <Form.Control id="EthValue" value={EthValueWei} onFocus={this.copy} />
                        <Form.Control id="EthValue" value={EthValueWeiHex} onFocus={this.copy} />
                    </Form.Group>

                </Form>
            </Container>
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
})(Tools);
