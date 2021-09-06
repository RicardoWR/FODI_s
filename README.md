## 快速部署

前端：
https://logi.im/front-end/scf-fodi.html

后端：
https://logi.im/back-end/fodi-on-cloudflare.html

## 自行部署

1. 开启[Onedrive API](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)
2. 注册一个新应用，受支持的帐户类型选择任何组织目录中的帐户和个人，获取应用程序(客户端) ID`client_id`
3. 证书和密码中创建客户端密码，获取值`client_secret`
4. 本地安装[rclone](https://rclone.org/downloads/)
5. 使用`rclone`获取`refresh_token`
6. 下载`worker.js`然后替换`const clientId`和`const clientSecret`改成自己的`client_id`和`client_secret`
7. 修改`const ONEDRIVE_REFRESHTOKEN`为`refresh token`
8. 把代码部署到[Cloudflare Workers](https://www.cloudflare.com/)
9. 世纪互联账号参考原教程
