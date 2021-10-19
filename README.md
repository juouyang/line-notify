# line-notify
A demo server to send messages through LINE notify

### Setup on LINE Notify
 - Create a new [LINE notify](https://notify-bot.line.me/my/services/new)
 - Fill in the required information
 - Service URL is http://[your-route].apps.[cluster_name].[base_domain]
 - Callback URL is: http://[your-route].apps.[cluster_name].[base_domain]/add-notify-user
 - Encode `Client ID` and `Client Secret` with base64 and paste it to the file `line-notify-secret.yml`

### Setup on OpenShift
 - You need to have an OpenShift 4
 - Login to OpenShift Web management console
 - Deploy from git using the latest Node.js
 - Note: Must manually change the route in the source code
 - Apply your `line-notify-secret.yml`
 - Manual edit the deployment to add two environment varaibles: CLIENT_ID and CLIENT_SECRET

### Setup on your LINE
 - Acceess `http://[your-route].apps.[cluster_name].[base_domain]/oauth.html` by the browser
 - Click `Add to LineNotify List`
 - Send test messages by: `curl -X GET http://[your-route].apps.[cluster_name].[base_domain]/line-notify?message=foo`

### Reference
 - [LINE Notify](https://notify-bot.line.me/en/)
 - [LINE Notify API](https://notify-bot.line.me/doc/en/)
