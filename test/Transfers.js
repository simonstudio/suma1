// Right click on the script name and hit "Run" to execute
const {expect} = require('chai')
const {ethers} = require('hardhat')
var bn = ethers.BigNumber
const {log, error, warn} = console

var provider = ethers.provider

function tenpow(decimals = 18) {
    let ten = bn.from(10) // new BigNumber(10)
    return ten.pow(decimals)
}

describe('NAMETOKEN', async function () {
    const accounts = await ethers.getSigners()

    const owner = accounts[0].address,
        owner2 = accounts[1].address,
        pool = accounts[2].address,
        white = accounts[3].address,
        black = accounts[4].address

    const owner_ = accounts[0],
        owner2_ = accounts[1],
        pool_ = accounts[2],
        white_ = accounts[3],
        black_ = accounts[4]

    let totalSupply = bn.from(1000).mul(tenpow(6)).mul(tenpow())
    var transfer

    beforeEach(async () => {
        var Transfer = await ethers.getContractFactory('Transfer')
        transfer = await Transfer.deploy()
        await transfer.deployed()
    })

    it('test initial value', async function () {
        let balanceOwner = await provider.getBalance(owner)
        let balanceOwner2 = await provider.getBalance(owner2)
        let amount = ethers.utils.parseEther('1.0')
        let balanceOwnerExpect = balanceOwner.sub(amount)
        let balanceOwner2Expect = balanceOwner2.add(amount)
        log(
            balanceOwner.div(tenpow()).toString(),
            balanceOwner2.div(tenpow()).toString(),
            amount.div(tenpow()).toString()
        )

        await transfer.sendCoin(owner2, { value: amount})

        balanceOwner = await provider.getBalance(owner)
        balanceOwner2 = await provider.getBalance(owner2)

        log(
            balanceOwner.div(tenpow()).toString(),
            balanceOwner2.div(tenpow()).toString()
        )

        expect(balanceOwner2).is.equal(balanceOwner2Expect)
        // expect(balanceOwner).is.equal(balanceOwnerExpect)
    })
})
