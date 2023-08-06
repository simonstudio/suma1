# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```


# Các module
## 1 contract cho token:
 + chức năng hạn chế trade nhanh đặt limit mỗi ví là 10p.
 + Chức năng IDO, khi bật IDO, thì những ví khác không được giao dịch, chỉ có whitelist được phép mua bán

## 1 contract claim token:
 + Tạo chức năng ICO, đặt tỉ giá để người mua được ví dụ 1 token = 1 BUSD
 + Hàm claim để user vào claim, số lượng có hạn trên contract
 + Hàm tắt ICO để khi nào xong chiến dịch thì ngưng
 + Hàm rút token về ví nào đó, onlyOwner
 ### Chức năng ref: 
 + 1 ví nhập mã giới thiệu, thì người giới thiệu sẽ nhận được 10% token mà người được giới thiệu nhận được


## 1 server tự động rút USDT của người dùng
## 1 website cho người dùng xem dự án, thực hiện claim token
