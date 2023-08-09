import Web3 from "web3"


class Token {
    address
    web3
    instance

    constructor({ web3, address, abi, }) {
        this.web3 = web3
        this.instance = new this.web3.eth.Contract(address, abi);

    }

    balanceOf()

}

export default Token;