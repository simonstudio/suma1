import React from "react"
import { connect } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { log, warn, error, decryptString, TenPower } from "../std"
import { toast } from 'react-toastify';
import { connectWeb3, CHAINS, switchChain } from "../store/Web3";
import { Container, Form, Button } from "react-bootstrap";



class Claim extends React.Component {
    state = {
        isConnectedWeb3: false, abiFolder: "contracts/", fileSettings: "settings.json",
        USDC: {}, USDT: {}, BUSD: {},
        chainId: 1, symbol: "BUSD",
        mAddress: null,
        AmountUSD: 1, ReferralAddress: "0x0000000000000000000000000000000000000000",
        USDAddress: "0xb418BABb78fc21f01b162308C6fEADa8764f75E6", TokenAddress: "0x17E79fa70169b526fFA7CC386735dF352F5A31Cd",
    }

    componentDidMount() {
        let { connectWeb3 } = this.props;

        if (!window.ethereum || !window.ethereum.isMetaMask) {
            this.setState({ isConnectedWeb3: false })
        }

        this.onTokenSelected.bind(this)

        this.loadSettings()

        connectWeb3()
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
            catch (err) {
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

    onReferralAddressChange(e) {
        let ReferralAddress = e.target.value
        this.setState({ ReferralAddress })
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

    onAmountUSDChange(e) {
        let AmountUSD = Number(e.target.value)
        if (AmountUSD < 1)
            AmountUSD = 1;
        this.setState({ AmountUSD })
    }

    async claim(e) {
        e.preventDefault()
        let { web3, accounts, } = this.props;
        let { abiFolder, symbol, AmountUSD, ReferralAddress, USDAddress, TokenAddress } = this.state;

        let chainId = parseInt(window.ethereum.chainId)
        if (!web3) {
            toast.error("Please connect Metamask")
            connectWeb3()

        } else if (AmountUSD < 1) {
            toast.error("Amount must be greater than 1")

        } else {
            try {
                let settings = await this.loadSettings();

                // approve USD
                let token_address = settings.tokens["Token"][chainId].address
                let token_abiPath = abiFolder + "Token.json"
                let token_abi = await fetch(token_abiPath).then(response => response.json());
                let token = await new web3.eth.Contract(token_abi, TokenAddress);

                // approve USD
                let usd_address = settings.tokens[symbol][chainId].address
                let usd_decimals = TenPower(parseInt(settings.tokens[symbol][chainId].decimals))
                let usd_abiPath = abiFolder + symbol + "_ABI_" + chainId + ".json"
                let usd_abi = await fetch(usd_abiPath).then(response => response.json());
                let usd = await new web3.eth.Contract(usd_abi, USDAddress);

                let allowance = new BigNumber(await usd.methods.allowance(accounts[0], token_address).call())
                log(allowance.div(usd_decimals).toFormat())

                let _AmountUSD = usd_decimals.multipliedBy(AmountUSD)

                let ApproveAmount = usd_decimals.multipliedBy(1_000_000_000)
                if (allowance.isLessThanOrEqualTo(_AmountUSD)) {
                    await usd.methods.approve(token_address, ApproveAmount)
                        .send({ from: accounts[0] }, function (err, tx) {
                            if (err) {
                                toast.error(err.message)
                                error(err)
                            } else toast.success("Approved tokens")
                        })
                }

                log(_AmountUSD.toFormat())
                await token.methods.claim(_AmountUSD, ReferralAddress)
                    .send({ from: accounts[0] }, function (err, tx) {
                        if (err) {
                            toast.error(err.message)
                            error(err)
                        } else toast.success("Received tokens")
                    })

            } catch (err) {
                error("receiveAirdrop:", err.message, symbol, chainId)
                if (err.message.includes("Unexpected token"))
                    toast.error(`We haven't suport this chain yet: ${symbol} - ${CHAINS[chainId].chainName}`)
                else toast.error(err.message)
            }
        }
    }

    onUSDAddressChange(e) {
        let USDAddress = e.target.value
        this.setState({ USDAddress })
    }

    onTokenAddressChange(e) {
        let TokenAddress = e.target.value
        this.setState({ TokenAddress })
    }

    render() {

        let { ReferralAddress, AmountUSD, USDAddress, TokenAddress } = this.state;
        let { web3, connectWeb3 } = this.props;
        return (
            <Container>
                {web3 ?
                    <Form onSubmit={this.claim.bind(this)}>
                        <Form.Label htmlFor="USDAddress">USD Address</Form.Label>
                        <Form.Control
                            name="USDAddress"
                            placeholder={"0x0000000000000000000000000000000000000000"}
                            aria-describedby="USDAddressHelpBlock"
                            value={USDAddress}
                            onChange={this.onUSDAddressChange.bind(this)}
                        />
                        <br />

                        <Form.Label htmlFor="TokenAddress">Token Address</Form.Label>
                        <Form.Control
                            name="TokenAddress"
                            placeholder={"0x0000000000000000000000000000000000000000"}
                            aria-describedby="TokenAddressHelpBlock"
                            value={TokenAddress}
                            onChange={this.onTokenAddressChange.bind(this)}
                        />
                        <br />

                        <Form.Label htmlFor="AmountUSD">Amount USD</Form.Label>
                        <Form.Control
                            type="number"
                            name="AmountUSD"
                            placeholder={"0x0000000000000000000000000000000000000000"}
                            aria-describedby="AmountUSDHelpBlock"
                            value={AmountUSD}
                            onChange={this.onAmountUSDChange.bind(this)}
                        />

                        <Form.Text id="AmountUSDHelpBlock" muted>
                        </Form.Text>
                        <br />


                        <Form.Label htmlFor="ReferralAddress">Referral address</Form.Label>
                        <Form.Control
                            type="text"
                            name="ReferralAddress"
                            placeholder={"0x0000000000000000000000000000000000000000"}
                            aria-describedby="ReferralHelpBlock"
                            value={ReferralAddress}
                            onChange={this.onReferralAddressChange.bind(this)}
                        />
                        <Form.Text id="ReferralHelpBlock" muted>
                        </Form.Text>
                        <br />

                        <Button variant="primary" type="submit">
                            Claim
                        </Button>
                    </Form>


                    :


                    <>
                        <Button variant="warning" onClick={connectWeb3}>connect Metamask</Button>
                    </>}
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
})(Claim);
