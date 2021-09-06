前端：
https://logi.im/front-end/scf-fodi.html

后端：
https://logi.im/back-end/fodi-on-cloudflare.html

API
自行注册应用，记下client_id和secret
使用rclone config获取refresh token
cf worker修改 const ONEDRIVE_REFRESHTOKEN 为 refresh token
const clientId 和 const clientSecret 改成自己的client_id和secret，至于改第一行还是第二行取决于 const IS_CN 值是0是1
