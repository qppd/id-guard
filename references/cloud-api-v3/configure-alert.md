# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/doorSensor/standaloneDoorSensor/configAlertFlagEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Configure alert

**`https://euapi.ttlock.com/v3/standaloneDoorSensor/configAlertFlag`**

After saving the reminder configuration by calling this interface, you need to open and close the door sensor again for the configuration to take effect.

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

9

1

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/standaloneDoorSensor/configAlertFlag' \\

2

\--data\-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \\

3

\--data\-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \\

4

\--data\-urlencode 'doorSensorId=100123' \\

5

\--data\-urlencode 'notCloseAlertFlag=1' \\

6

\--data\-urlencode 'notCloseAlertSecondNum=100' \\

7

\--data\-urlencode 'longTimeNotOpenAlertFlag=1' \\

8

\--data\-urlencode 'longTimeNotOpenDayNum=10' \\

9

\--data\-urlencode 'date=1625025703000'

### 2 Request parameters

Name

Type

Required

Description

clientId

String

Y

Client\_id from [Create application](/CreateApplication)

accessToken

String

Y

Access token，refer to: [Get access token](/document/doc?urlName=cloud/oauth2/getAccessTokenEn.html)

doorSensorId

Int

Y

Door sensor ID

notCloseAlertFlag

Int

Y

Door not closed reminder indicator: Value range 1 - Open, 2 - Closed

notCloseAlertSecondNum

Int

N

Door not closed reminder time, unit: seconds, range: 1~900 seconds.

longTimeNotOpenAlertFlag

Int

Y

Long-term inactivity reminder indicator: Value range 1 - On, 2 - Off

longTimeNotOpenDayNum

Int

N

Long-term door inactivity reminder time, unit: days, range: 1-15 days.

date

Long

Y

Current time (timestamp, in milliseconds)

### 3 Response and example

Parameter

Type

Description

errcode

Int

Error code

errmsg

String

Error message

errmsg

String

Error information

xxxxxxxxxx

5

1

{

2

    "errcode": 0, 

3

    "errmsg": "none error message",

4

    "description":"表示成功或是"

5

}