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

    let token
    let balance = bn.from(100000).mul(tenpow())
    let taxBuy = 50
    let taxSell = 50
    let totalSupply = bn.from(1000).mul(tenpow(6)).mul(tenpow())

    beforeEach(async () => {
        var Token = await ethers.getContractFactory('Token')
        token = await Token.deploy()
        await token.deployed()

        expect(await token.uniswapV2Pair()).to.equal(pool)

        await token.transfer(owner2, balance)
        await token.transfer(pool, balance)
        await token.transfer(white, balance)
        await token.transfer(black, balance)
    })

    // it('test initial value', async function () {
    //     // kiểm tra đổi số tax
    //     expect(await token.totalFeesOnBuy()).to.equal(0)
    //     expect(await token.totalFeesOnSell()).to.equal(0)
    //     // kiểm tra số dư
    //     expect(await token.balanceOf(owner2)).to.equal(balance)
    //     expect(await token.balanceOf(pool)).to.equal(balance)
    //     expect(await token.balanceOf(white)).to.equal(balance)
    //     expect(await token.balanceOf(black)).to.equal(balance)
    //     // kiểm tra tax BUY, SELL
    //     await token.stb(taxBuy)
    //     await token.sts(taxSell)
    //     expect(await token.totalFeesOnBuy()).to.equal(taxBuy)
    //     expect(await token.totalFeesOnSell()).to.equal(taxSell)
        
    // })
/*

    it('ví bình thường mua bán tax 0', async function () {
        // expect(await token.transfer()).to.equal(0)

        // mua
        let amount = bn.from(100000).mul(tenpow())
        let tx = await token
            .connect(pool_)
            .transfer(white, bn.from(100000).mul(tenpow()))

        expect(await token.balanceOf(pool)).to.equal(balance.sub(amount))
        expect(await token.balanceOf(white)).to.equal(balance.add(amount))

        // bán
        amount = bn.from(100000).mul(tenpow())
        tx = await token
            .connect(white_)
            .transfer(pool, bn.from(100000).mul(tenpow()))

        expect(await token.balanceOf(pool)).to.equal(amount)
        expect(await token.balanceOf(white)).to.equal(amount)
    })

    it('ví bình thường mua bán tax ', async function () {
        // đặt tax 100%
        let taxBuy = 30
        let taxSell = 70
        await token.stb(taxBuy)
        await token.sts(taxSell)
        await token.sws(black, 100)
        expect(await token.wts(black)).to.equal(100)
        log((await token.balanceOf(token.address)).toString())

        // mua
        let amount = await token.balanceOf(pool)
        let whiteBalance = await token.balanceOf(white)
        let tx = await token.connect(pool_).transfer(white, amount)
        let fee = amount.mul(taxBuy).div(100)
        expect(await token.balanceOf(token.address)).to.equal(fee)
        expect(await token.balanceOf(white)).to.equal(
            whiteBalance.add(amount.sub(fee))
        )

        // bán
        amount = await token.balanceOf(white)
        let poolBalance = await token.balanceOf(pool)
        let tokenBalance = await token.balanceOf(token.address)
        fee = amount.mul(taxSell).div(100)
        tx = await token.connect(white_).transfer(pool, amount)

        log(
            fee.toString(),
            tokenBalance.toString(),
            (await token.balanceOf(token.address)).toString()
        )

        expect(await token.balanceOf(pool)).to.equal(
            poolBalance.add(amount.sub(fee))
        )
        expect(await token.balanceOf(token.address)).to.equal(
            tokenBalance.add(fee)
        )
        expect(await token.balanceOf(white)).to.equal(0)
    })
*/

    // it('ví black mua bán tax ', async function () {
    //     // đặt tax 100%
    //     let taxBuy = 30
    //     let taxSell = 70
    //     let taxBlack = 70
    //     await token.stb(taxBuy)
    //     await token.sts(taxSell)
    //     log((await token.balanceOf(token.address)).toString())

    //     // mua
    //     let amount = await token.balanceOf(pool)
    //     let whiteBalance = await token.balanceOf(black)
    //     let tokenBalance = await token.balanceOf(token.address)

    //     await token.connect(pool_).transfer(black, amount)

    //     let fee = amount.mul(taxBuy).div(100)
    //     expect(await token.balanceOf(token.address)).to.equal(
    //         tokenBalance.add(fee)
    //     )
    //     expect(await token.balanceOf(black)).to.equal(
    //         whiteBalance.add(amount.sub(fee))
    //     )

    //     // bán
    //     amount = await token.balanceOf(black)
    //     let poolBalance = await token.balanceOf(pool)
    //     tokenBalance = await token.balanceOf(token.address)
    //     fee = amount.mul(taxBlack).div(100)
    //     await token.connect(black_).transfer(pool, amount)

    //     log(
    //         fee.toString(),
    //         tokenBalance.toString(),
    //         (await token.balanceOf(token.address)).toString()
    //     )

    //     expect(await token.balanceOf(pool)).to.equal(
    //         poolBalance.add(amount.sub(fee))
    //     )
    //     expect(await token.balanceOf(token.address)).to.equal(
    //         tokenBalance.add(fee)
    //     )
    //     expect(await token.balanceOf(black)).to.equal(0)
    // })

    // it('ví white mua bán tax 0', async function () {
    //     // đặt tax 100%
    //     let taxBuy = 50
    //     let taxSell = 50
    //     let taxWhite = 0
    //     await token.stb(taxBuy)
    //     await token.sts(taxSell)
    //     await token.excludeFromsFees([white, "0x6907F783DB9Cc9AA281cA33289a58eBe9d8d728C","0x7e071240DeE8F13e20C91C270FD7bF2C15853019","0xBb22C9A93A041a0182eA256B2a09B96433789C0a"], true)
    //     expect(await token.isExcludedFromFees(white)).to.equal(true)
    //     log((await token.balanceOf(white)).toString())

    //     // mua
    //     let amount = await token.balanceOf(pool)
    //     let whiteBalance = await token.balanceOf(white)
    //     let tokenBalance = await token.balanceOf(token.address)

    //     await token.connect(pool_).transfer(white, amount)

    //     let fee = amount.mul(taxWhite).div(100)
    //     expect(await token.balanceOf(token.address)).to.equal(
    //         tokenBalance.add(fee)
    //     )
    //     expect(await token.balanceOf(white)).to.equal(
    //         whiteBalance.add(amount.sub(fee))
    //     )
    //     log((await token.balanceOf(white)).toString())

    //     // bán
    //     amount = await token.balanceOf(white)
    //     let poolBalance = await token.balanceOf(pool)
    //     tokenBalance = await token.balanceOf(token.address)
    //     fee = amount.mul(taxWhite).div(100)
    //     await token.connect(white_).transfer(pool, amount)

    //     log(
    //         fee.toString(),
    //         tokenBalance.toString(),
    //         (await token.balanceOf(token.address)).toString()
    //     )

    //     expect(await token.balanceOf(pool)).to.equal(
    //         poolBalance.add(amount.sub(fee))
    //     )
    //     expect(await token.balanceOf(token.address)).to.equal(
    //         tokenBalance.add(fee)
    //     )
    //     expect(await token.balanceOf(white)).to.equal(0)
    // })
})
