// Right click on the script name and hit "Run" to execute
const {expect} = require('chai')
const {ethers} = require('hardhat')
var bn = ethers.BigNumber
const {log, error, warn} = console

function tenpow(decimals = 18) {
    let ten = bn.from(10) // new BigNumber(10)
    return ten.pow(decimals)
}

describe('NAMETOKEN', async function () {
    var accounts = await ethers.getSigners()

    var [owner_, user1_, user2_, white1_, white2_] = accounts

    var owner = owner_.address,
        user1 = user1_.address,
        user2 = user2_.address,
        white1 = white1_.address,
        white2 = white2_.address

    var token,
        usd,
        priceUSD = 1000,
        balance = bn.from(1000).mul(tenpow())
    var totalSupply = bn.from(1000).mul(tenpow(6)).mul(tenpow())

    beforeEach(async () => {
        var BUSD = await ethers.getContractFactory('BEP20Token')
        usd = await BUSD.deploy()
        await usd.deployed()

        var Token = await ethers.getContractFactory('Token')
        token = await Token.deploy(usd.address, priceUSD)
        await token.deployed()

        await usd.transfer(user1, balance)
        await usd.transfer(user2, balance)
        await usd.transfer(white1, balance)
        await usd.transfer(white2, balance)
    })

    // it('test initial value', async function () {
    //     // kiểm tra số dư USD
    //     expect(await usd.balanceOf(owner)).to.equal(
    //         (await usd.totalSupply()).sub(balance.mul(4))
    //     )
    //     expect(await token.balanceOf(owner)).to.equal(await token.totalSupply())
    //     expect(await usd.balanceOf(user1)).to.equal(balance)
    //     expect(await usd.balanceOf(user2)).to.equal(balance)
    //     expect(await usd.balanceOf(white1)).to.equal(balance)
    //     expect(await usd.balanceOf(white2)).to.equal(balance)
    // })

    it('test ico', async function () {
        let 
        // bật ico
        await token.setIco(true)

        expect(await token.isIco()).to.equal(true)
        let amountUSD = bn.from(1000).mul(tenpow())

        // dùng 1 ví user1 claim 1000$
        let tx = await token.connect(user1_).claim(tenpow().mul(10), user2)

        // await expect(
        //     greeter.addWhitelistAddress(ethers.constants.AddressZero)
        // ).to.be.revertedWith('Invalid address')

        expect(await usd.balanceOf(user1)).to.equal(balance)
        expect(await token.balanceOf(user1)).to.equal(balance)
        expect(await token.balanceOf(user2)).to.equal(balance)
    })
})
