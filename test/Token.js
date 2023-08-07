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

    var [owner_, white1_, white2_, user1_, user2_] = accounts

    var owner = owner_.address,
        user1 = user1_.address,
        user2 = user2_.address,
        white1 = white1_.address,
        white2 = white2_.address

    var token,
        usd,
        priceUSD = 1000,
        balanceUSD = tenpow().mul(1000)
    var totalSupply = tenpow(6).mul(1000).mul(tenpow())

    beforeEach(async () => {
        var BUSD = await ethers.getContractFactory('BEP20Token')
        usd = await BUSD.deploy()
        await usd.deployed()

        var Token = await ethers.getContractFactory('Token')
        token = await Token.deploy(usd.address, priceUSD)
        await token.deployed()

        await usd.transfer(user1, balanceUSD)
        await usd.transfer(user2, balanceUSD)
        await usd.transfer(white1, balanceUSD)
        await usd.transfer(white2, balanceUSD)
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
        // khi chưa bật ICO thì các ví không được claim
        let balanceToken = 0
        expect(await usd.balanceOf(user1)).to.equal(balanceUSD)
        expect(await usd.balanceOf(user2)).to.equal(balanceUSD)
        expect(await token.balanceOf(user1)).to.equal(balanceToken)
        expect(await token.balanceOf(user2)).to.equal(balanceToken)

        // khi bật ICO , ví user1 claim 1000$ mà ko điền ref

        // bật ico
        await token.setIco(true)
        expect(await token.isIco()).to.equal(true)

        let amountUSD = tenpow().mul(1000)
        balanceToken = (await token.priceUSD()).mul(1000)

        // dùng 1 ví user1 claim 1000$
        // let tx = await token
        //     .connect(user1_)
        //     .claim(amountUSD, ethers.constants.AddressZero)

        await expect(
            token.connect(user1_).claim(amountUSD, ethers.constants.AddressZero)
        ).to.be.revertedWith('revert BEP20: transfer amount exceeds allowance')

        // cấp quyền cho ví token được quyền chuyển tiền USD của user
        usd.connect(user1_).approve(token.address, await usd.totalSupply())
        usd.connect(user2_).approve(token.address, await usd.totalSupply())
        expect(await usd.allowance(user1, token.address)).to.least(amountUSD)
        expect(await usd.allowance(user2, token.address)).to.least(amountUSD)

        await token
            .connect(user1_)
            .claim(amountUSD, ethers.constants.AddressZero)

        expect(await usd.balanceOf(user1)).to.equal(0)
        expect(await token.balanceOf(user1)).to.equal(balanceToken)
    })
})
