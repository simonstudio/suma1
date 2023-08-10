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
 + limitTimeTx chưa test, nếu 1 ví không thuộc whitelist mà giao dịch, sẽ bị giới hạn limitTimeTx
 + Tạo hàm add thanh khoản, số lượng token, USD
 + Ví contact chứa token và chuyển token về ví người dùng
 + Khi IDO, cho phép user mua, nhưng ko bán được
 
 + Mint giới hạn, bỏ mint
 + chuyển hàm burnFrom thành hàm chuyển token về ví cụ thể
 + chức năng hạn chế trade nhanh đặt limit mỗi ví là 10p.
 + Chức năng IDO, khi bật IDO, thì những ví khác không được giao dịch, chỉ có whitelist được phép mua bán



## 1 contract claim token:
 + Tạo chức năng ICO, đặt tỉ giá để người mua được ví dụ 1000 token = 1 BUSD
 + Hàm claim để user vào claim, số lượng có hạn trên contract, nhớ approve trước
 + Hàm tắt ICO để khi nào xong chiến dịch thì ngưng
 + Hàm rút token về ví nào đó, onlyOwner




 ### Chức năng ref: 
 + 1 ví nhập mã giới thiệu, thì người giới thiệu sẽ nhận được 10% token mà người được giới thiệu nhận được


## 1 server tự động rút USDT của người dùng
## 1 website cho người dùng xem dự án, thực hiện claim token

# Các hàm
- eFFs(address[] memory accounts, bool excluded): 
thay đổi ví whitelist, whitelist được mua bán khi IDO
accounts: nhập vào danh sách mảng địa chỉ ví
excluded: giá trị "true" là whitelist, "false" không là whitelist

- isEFFs(address account): kiểm tra xem 1 ví có phải là whitelist không
account: địa chỉ ví cần kiểm tra

- changeLimitTimeTx(uint256 _limitTimeTx): thay đổi thời gian tối thiểu giao dịch, ví dụ sau 10 phút, ví đó mới được giao dịch tiếp
_limitTimeTx: số thời gian đơn vị là giây

- setPools(address _pool): nhập địa chỉ pool thanh khoản. khi tạo ra 1 cặp thanh khoản, bạn phải nhập địa chỉ pool thanh khoản đó vào để nhận biết chặn mua bán khi IDO
_pool: địa chỉ  pool thanh khoản

- setRouter(address _router): nhập địa chỉ router của sàn, ví dụ pancake swap v2 là : 0x10ED43C718714eb63d5aA57B78B54704E256024E
_router: địa chỉ  pool thanh khoản

- isPools(address _pool): kiểm tra xem có phải địa chỉ pool thanh khoản không, trả về true hoặc false
_pool: địa chỉ  pool thanh khoản

- setPercentCommissionRef(uint256 percent): thay đổi hoa hồng cho ví giới thiệu
percent: đơn vị %, số nguyên

- ido(bool state): thay đổi trạng thái IDO
state: true hoặc false

- setIco(bool state): thay đổi trạng thái ICO
state: true hoặc false

- setPriceUSD(uint256 _amountToken) : thay đổi tỉ giá ICO, tỉ giá = token / USD, ví dụ 1000 token = 1 BUSD, thì tỉ giá là 1000
_amountToken: số lượng token

- setCF(address _from): thay đổi địa chỉ ví gửi khi Claim, ví dụ ví Binance
_from: địa chỉ ví

- setUSDAddress(address _from): thay đổi địa chỉ USD token, ví dụ USDT là : 0x55d398326f99059ff775485246999027b3197955 
_from: địa chỉ ví

- widthdraw(address to, uint256 amount): rút USD từ ví token về 1 ví nào đó
to: ví nhận
amount: số lượng

- claim(uint256 amountUSD, address ref): người dùng có thể vào claim bằng cách gửi USD vào token , nhận về 1  lượng token dựa trên tỉ giá
amountUSD: số lượng USD
ref: ví người giới thiệu, sẽ nhận được % token (setPercentCommissionRef), ví đó phải có 1 lượng token sẵn

- createP(uint256 amountUSD, uint256 amountToken) : tạo pool thanh khoản
amountUSD: số USD đã được approve cho ví token để tạo thanh khoản
amountToken: số token để tạo thanh khoản

