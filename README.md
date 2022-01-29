# serveless-get-s3-and-notify-email
This project with the serverless use to read json files of a bucket (s3) and send a email SMTP

## Install Serverless
```
npm install -g serverless
```

## Install the lib
```
npm install
```

## Configures your environments variables in serverless.yml
```
   environment:
      BUCKET: name_bucket
      EMAIL_TRIGGER: trigger@email.com
      PASS_TRIGGER: pass
      EMAIL_NOTIFIED: notified@email.com
      SMTP_HOST: yourhost.email.com
 ```
  
  ## In AWS console
  ```
  1. Create your user to lambda function
  2. Conecting with your project
    serverless config credentials -o --provider aws --key=YOUR_KEY ---secret YOUR_SECRET_KEY
  3. Make deploy
    npm run deploy
  4. To debug
    serverless invoke -f requestControl -l
```
