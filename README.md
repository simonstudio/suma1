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
- 1 contract cho token, chức năng hạn chế trade nhanh đặt limit mỗi ví là 10p.
- 1 contract claim token
- 1 server tự động rút USDT của người dùng
- 1 website cho người dùng xem dự án, thực hiện claim token