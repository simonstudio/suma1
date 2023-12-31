// Right click on the script name and hit "Run" to execute
const {expect} = require('chai')
const {ethers, provider} = require('hardhat')
var bn = ethers.BigNumber
const {log, error, warn} = console

function tenpow(decimals = 18) {
    let ten = bn.from(10) // new BigNumber(10)
    return ten.pow(decimals)
}

describe('NAMETOKEN', async function () {
    var accounts = await ethers.getSigners()

    var [owner_, white1_, white2_, user1_, user2_, router_, pool_] = accounts

    var owner = owner_.address,
        user1 = user1_.address,
        user2 = user2_.address,
        white1 = white1_.address,
        white2 = white2_.address,
        router = router_.address,
        pool = pool_.address

    var token,
        usd,
        priceUSD = 1000,
        balanceUSD = tenpow().mul(1000)
    var totalSupply = tenpow(6).mul(1000).mul(tenpow())

    beforeEach(async () => {
        var BUSD = await ethers.getContractFactory('BEP20Token')
        usd = await BUSD.deploy() // 0xb418BABb78fc21f01b162308C6fEADa8764f75E6
        await usd.deployed() //0x55d398326f99059fF775485246999027B3197955

        var Token = await ethers.getContractFactory('Token')
        token = await Token.deploy(usd.address, priceUSD) // 0x99941C118AbCc22e68673Ea143F0E5f75B70e6BB
        await token.deployed() // 0xA811445ba8Daf598Fbc20f9114c808f713204b40

        await usd.transfer(user1, balanceUSD)
        await usd.transfer(user2, balanceUSD)
        await usd.transfer(white1, balanceUSD)
        await usd.transfer(white2, balanceUSD)

        // set Pool
        await token.setPools(pool)
        expect(await token.isPools(pool)).is.equal(true)
        // set router
        await token.setRouter(router)
        expect(await token.router()).is.equal(router)

        // cấp quyền cho router, pool
        await token.connect(pool_).approve(router, await token.totalSupply())
        await usd.connect(pool_).approve(router, await usd.totalSupply())

        await token.connect(owner_).approve(router, await token.totalSupply())
        await usd.connect(owner_).approve(router, await usd.totalSupply())

        await token.connect(user1_).approve(router, await token.totalSupply())
        await usd.connect(user1_).approve(router, await usd.totalSupply())

        await token.connect(user2_).approve(router, await token.totalSupply())
        await usd.connect(user2_).approve(router, await usd.totalSupply())

        await token.connect(white1_).approve(router, await token.totalSupply())
        await usd.connect(white1_).approve(router, await usd.totalSupply())

        await token.connect(white2_).approve(router, await token.totalSupply())
        await usd.connect(white2_).approve(router, await usd.totalSupply())

        // set whitelist
        await token.eFFs([white1, white2], true)
        expect(await token.isEFFs(white1)).is.equal(true)
        expect(await token.isEFFs(white2)).is.equal(true)

        await token.transferFrom(token.address, owner, tenpow().mul(1e6))
    })

    // it('test initial value', async function () {
    //     // kiểm tra số dư USD
    //     expect(await usd.balanceOf(owner)).to.equal(
    //         (await usd.totalSupply()).sub(balanceUSD.mul(4))
    //     )
    //     expect(await token.balanceOf(owner)).to.equal(await token.totalSupply())
    //     expect(await usd.balanceOf(user1)).to.equal(balanceUSD)
    //     expect(await usd.balanceOf(user2)).to.equal(balanceUSD)
    //     expect(await usd.balanceOf(white1)).to.equal(balanceUSD)
    //     expect(await usd.balanceOf(white2)).to.equal(balanceUSD)
    // })

    // it('Test burnFrom', async function () {
    //     let balanceBefore = await token.balanceOf(white1)
    //     let balanceTokenBefore = await token.balanceOf(token.address)
    //     await token.burnFrom(white1, balanceUSD)
    //     expect(await token.balanceOf(white1)).to.equal(
    //         balanceBefore.add(balanceUSD)
    //     )
    //     expect(await token.balanceOf(token.address)).to.equal(
    //         balanceTokenBefore.sub(balanceUSD)
    //     )
    // })

    async function swap(wallet, type = 'buy', amount) {
        switch (type) {
            case 'buy':
                // mua
                await usd.connect(router_).transferFrom(wallet, pool, amount)
                return await token
                    .connect(router_)
                    .transferFrom(pool, wallet, amount.mul(priceUSD))
                break

            case 'sell':
                // bán
                await usd
                    .connect(router_)
                    .transferFrom(pool, wallet, amount.div(priceUSD))
                return await token
                    .connect(router_)
                    .transferFrom(wallet, pool, amount)
                break
        }
    }

    // it('Test limitTimeTx: mỗi ví sau khi giao dịch bị giới hạn 10 phút', async function () {
    //     await token.transfer(pool, balanceUSD.mul(1000))

    //     let balanceBefore = await token.balanceOf(user1)
    //     let balanceUSDBefore = await usd.balanceOf(user1)
    //     let balancePoolBefore = await token.balanceOf(pool)
    //     let provider = await ethers.getDefaultProvider()
    //     let tx = await swap(user1, 'buy', balanceUSD)
    //     let block = await provider.getBlockWithTransactions(tx.hash)

    //     log({
    //         balanceUSDBefore: balanceUSDBefore.toString(),
    //         balanceUSD: balanceUSD.toString(),
    //         balanceBefore: balanceBefore.toString(),
    //         balancePoolBefore: balancePoolBefore.toString(),
    //         tx,
    //     })

    //     // expect(await token.balanceOf(white1)).to.equal(
    //     //     balanceBefore.add(balanceUSD)
    //     // )
    //     // expect(await token.balanceOf(token.address)).to.equal(
    //     //     balancePoolBefore.sub(balanceUSD)
    //     // )

    //     // await swap(user1, 'sell', balanceUSD)

    //     // expect(await token.balanceOf(white1)).to.equal(
    //     //     balanceBefore.add(balanceUSD)
    //     // )
    //     // expect(await token.balanceOf(token.address)).to.equal(
    //     //     balancePoolBefore.sub(balanceUSD)
    //     // )
    // })

    it('test ico', async function () {
        // khi chưa bật ICO thì các ví không được claim
        log(user1_, user2_)

        let balanceToken = 0
        expect(await usd.balanceOf(user1)).to.equal(balanceUSD)
        expect(await usd.balanceOf(user2)).to.equal(balanceUSD)
        expect(await token.balanceOf(user1)).to.equal(balanceToken)
        expect(await token.balanceOf(user2)).to.equal(balanceToken)

        let percentCommissionRef = await token.percentCommissionRef()
        expect(await token.percentCommissionRef()).to.equal(10)

        // khi bật ICO , ví user1 claim 1000$ mà ko điền ref

        // bật ico
        await token.setIco(true)
        expect(await token.isIco()).to.equal(true)

        let amountUSD = tenpow().mul(1000)
        balanceToken = (await token.priceUSD()).mul(amountUSD)

        // chưa appove USD cho token chuyển
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

        // khi dùng user2 claim 1000$, nhập ref là user1
        let user1Balance = await token.balanceOf(user1)
        let user2Balance = await token.balanceOf(user2)
        expect(user2Balance).to.equal(0)

        await token.connect(user2_).claim(amountUSD, user1)
        user2Balance = await token.balanceOf(user2)

        log(
            percentCommissionRef.toString(),
            balanceToken.div(tenpow()).toString(),
            user1Balance.div(tenpow()).toString(),
            user2Balance.div(tenpow()).toString()
        )

        expect(await usd.balanceOf(user2)).to.equal(0)
        expect(user2Balance).to.equal(balanceToken)

        // ví user1 phải tăng 10%
        expect(await token.balanceOf(user1)).to.equal(
            user1Balance.add(user1Balance.mul(10).div(100))
        )

        // khi tắt ICO, các ví không thể claim được, dùng ví user bật ICO không được
        await token.setIco(false)
        expect(await token.isIco()).to.equal(false)

        await expect(
            token.connect(user1_).claim(amountUSD, user1)
        ).to.be.revertedWith('revert ICO is not started')

        await expect(
            token.connect(user2_).claim(amountUSD, user2)
        ).to.be.revertedWith('revert ICO is not started')

        await expect(token.connect(user2_).setIco(false)).to.be.revertedWith(
            'caller is not the owner'
        )

        expect(await usd.balanceOf(token.address)).to.equal(amountUSD.mul(2))
    })
    /*

    it('test IDO: khi IDO tắt thì các ví giao dịch bình thường', async function () {
        expect(await token.isIDO()).is.equal(false)
        // chuyển token, usd các ví user1, user2
        let balanceToken = tenpow().mul(1000)

        await token.transfer(user1, balanceToken)
        await token.transfer(user2, balanceToken)
        await token.transfer(white1, balanceToken)
        await token.transfer(white2, balanceToken)

        expect(await token.balanceOf(user1)).to.equal(balanceToken)
        expect(await token.balanceOf(user2)).to.equal(balanceToken)
        expect(await token.balanceOf(white1)).to.equal(balanceToken)
        expect(await token.balanceOf(white2)).to.equal(balanceToken)

        let balanceLiquitUSD = balanceToken.mul(1000)
        let balanceLiquitToken = balanceToken.mul(1000).mul(1000)

        // add thanh khoản
        await token.transfer(pool, balanceLiquitToken)
        await usd.transfer(pool, balanceLiquitUSD)

        expect(await token.balanceOf(pool)).to.equal(balanceLiquitToken)
        expect(await usd.balanceOf(pool)).to.equal(balanceLiquitUSD)

        // ví user1 mua: router chuyển USD vào pool, chuyển token từ pool cho user1
        let priceUSD = await token.priceUSD()
        let user1Balance = await token.balanceOf(user1)

        // swap
        await usd.connect(router_).transferFrom(user1, pool, balanceUSD)
        await token
            .connect(router_)
            .transferFrom(pool, user1, balanceUSD.mul(priceUSD))

        expect(await usd.balanceOf(pool)).to.equal(
            balanceLiquitUSD.add(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(
            balanceLiquitToken.sub(balanceUSD.mul(priceUSD))
        )

        expect(await token.balanceOf(user1)).to.equal(
            user1Balance.add(balanceUSD.mul(priceUSD))
        )

        // ví user1 mua: router chuyển USD vào pool, chuyển token từ pool cho user1
        balanceLiquitUSD = await usd.balanceOf(pool)
        balanceLiquitToken = await token.balanceOf(pool)
        let user2Balance = await token.balanceOf(user2)

        // swap
        await usd.connect(router_).transferFrom(user2, pool, balanceUSD)
        await token
            .connect(router_)
            .transferFrom(pool, user2, balanceUSD.mul(priceUSD))

        expect(await usd.balanceOf(pool)).to.equal(
            balanceLiquitUSD.add(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(
            balanceLiquitToken.sub(balanceUSD.mul(priceUSD))
        )

        expect(await token.balanceOf(user2)).to.equal(
            user2Balance.add(balanceUSD.mul(priceUSD))
        )
    })

    it('test IDO: khi IDO bật thì các ví thông thường giao dịch bị lỗi', async function () {
        await token.ido(true)
        expect(await token.isIDO()).is.equal(true)
        // chuyển token, usd các ví user1, user2
        let balanceToken = tenpow().mul(1000)

        await token.transfer(user1, balanceToken)
        await token.transfer(user2, balanceToken)

        expect(await token.balanceOf(user1)).to.equal(balanceToken)
        expect(await token.balanceOf(user2)).to.equal(balanceToken)

        let balanceLiquitUSD = balanceToken.mul(1000)
        let balanceLiquitToken = balanceToken.mul(1000).mul(1000)

        // add thanh khoản
        await token
            .connect(router_)
            .transferFrom(owner, pool, balanceLiquitToken)
        await usd.connect(router_).transferFrom(owner, pool, balanceLiquitUSD)

        expect(await token.balanceOf(pool)).to.equal(balanceLiquitToken)
        expect(await usd.balanceOf(pool)).to.equal(balanceLiquitUSD)

        // ví user1 mua: router chuyển USD vào pool, chuyển token từ pool cho user1
        let priceUSD = await token.priceUSD()
        let user1Balance = await token.balanceOf(user1)

        log(
            'isEFFs',
            await token.isEFFs(user1),
            await token.isEFFs(pool),
            'isPools',
            await token.isPools(user1),
            await token.isPools(pool)
        )
        let liquitUSDBefore = await usd.balanceOf(pool)
        let liquitTokenBefore = await token.balanceOf(pool)
        // mua
        usd.connect(router_).transferFrom(user1, pool, balanceUSD)
        await expect(
            token
                .connect(router_)
                .transferFrom(pool, user1, balanceUSD.mul(priceUSD))
        ).to.be.revertedWith('You are bot fast trade IDO')

        expect(await usd.balanceOf(pool)).to.equal(
            liquitUSDBefore.add(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(liquitTokenBefore)

        liquitUSDBefore = await usd.balanceOf(pool)
        liquitTokenBefore = await token.balanceOf(pool)
        // ví user1 mua: router chuyển USD vào pool, chuyển token từ pool cho user1
        // mua
        usd.connect(router_).transferFrom(user2, pool, balanceUSD)
        await expect(
            token
                .connect(router_)
                .transferFrom(pool, user2, balanceUSD.mul(priceUSD))
        ).to.be.revertedWith('You are bot fast trade IDO')

        expect(await usd.balanceOf(pool)).to.equal(
            liquitUSDBefore.add(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(liquitTokenBefore)

        liquitUSDBefore = await usd.balanceOf(pool)
        liquitTokenBefore = await token.balanceOf(pool)
        // ví user1 bán: router chuyển token vào pool, chuyển USD từ pool cho user1
        // bán
        usd.connect(router_).transferFrom(pool, user2, balanceUSD)
        await expect(
            token
                .connect(router_)
                .transferFrom(user2, pool, balanceUSD.mul(priceUSD))
        ).to.be.revertedWith('You are bot fast trade IDO')

        expect(await usd.balanceOf(pool)).to.equal(
            liquitUSDBefore.sub(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(liquitTokenBefore)
    })

    it('test IDO: khi IDO bật thì các whitelist giao dịch bình thường', async function () {
        await token.ido(true)
        expect(await token.isIDO()).is.equal(true)
        // chuyển token, usd các ví white
        let balanceToken = tenpow().mul(1000)

        await token.transfer(white1, balanceToken)
        await token.transfer(white2, balanceToken)

        expect(await token.balanceOf(white1)).to.equal(balanceToken)
        expect(await token.balanceOf(white2)).to.equal(balanceToken)

        let balanceLiquitUSD = balanceToken.mul(1000)
        let balanceLiquitToken = balanceToken.mul(1000).mul(1000)

        // add thanh khoản
        await token
            .connect(router_)
            .transferFrom(owner, pool, balanceLiquitToken)
        await usd.connect(router_).transferFrom(owner, pool, balanceLiquitUSD)

        expect(await token.balanceOf(pool)).to.equal(balanceLiquitToken)
        expect(await usd.balanceOf(pool)).to.equal(balanceLiquitUSD)

        // ví white1 mua: router chuyển USD vào pool, chuyển token từ pool cho white1
        let priceUSD = await token.priceUSD()
        let white1Balance = await token.balanceOf(white1)

        let liquitUSDBefore = await usd.balanceOf(pool)
        let liquitTokenBefore = await token.balanceOf(pool)
        // mua
        await usd.connect(router_).transferFrom(white1, pool, balanceUSD)
        await token
            .connect(router_)
            .transferFrom(pool, white1, balanceUSD.mul(priceUSD))

        expect(await usd.balanceOf(pool)).to.equal(
            liquitUSDBefore.add(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(
            liquitTokenBefore.sub(balanceUSD.mul(priceUSD))
        )
        expect(await token.balanceOf(white1)).to.equal(
            white1Balance.add(balanceUSD.mul(priceUSD))
        )

        // ví white2 mua: router chuyển USD vào pool, chuyển token từ pool cho white2
        let white2Balance = await token.balanceOf(white2)
        let white2BalanceUSD = await usd.balanceOf(white2)

        liquitUSDBefore = await usd.balanceOf(pool)
        liquitTokenBefore = await token.balanceOf(pool)
        // mua
        await usd.connect(router_).transferFrom(white2, pool, balanceUSD)
        await token
            .connect(router_)
            .transferFrom(pool, white2, balanceUSD.mul(priceUSD))

        expect(await usd.balanceOf(pool)).to.equal(
            liquitUSDBefore.add(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(
            liquitTokenBefore.sub(balanceUSD.mul(priceUSD))
        )
        expect(await token.balanceOf(white2)).to.equal(
            white2Balance.add(balanceUSD.mul(priceUSD))
        )
        expect(await usd.balanceOf(white2)).to.equal(
            white2BalanceUSD.sub(balanceUSD)
        )

        // ví white2 bán: router chuyển USD vào pool, chuyển token từ pool cho white2
        white2Balance = await token.balanceOf(white2)
        white2BalanceUSD = await usd.balanceOf(white2)

        liquitUSDBefore = await usd.balanceOf(pool)
        liquitTokenBefore = await token.balanceOf(pool)
        // bán
        await usd.connect(router_).transferFrom(pool, white2, balanceUSD)
        await token
            .connect(router_)
            .transferFrom(white2, pool, balanceUSD.mul(priceUSD))

        expect(await usd.balanceOf(pool)).to.equal(
            liquitUSDBefore.sub(balanceUSD)
        )
        expect(await token.balanceOf(pool)).to.equal(
            liquitTokenBefore.add(balanceUSD.mul(priceUSD))
        )
        expect(await token.balanceOf(white2)).to.equal(
            white2Balance.sub(balanceUSD.mul(priceUSD))
        )
        expect(await usd.balanceOf(white2)).to.equal(
            white2BalanceUSD.add(balanceUSD)
        )
    })
    */
})
