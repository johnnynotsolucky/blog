---
title: Turn off PHP variable logging in Craft 3
description: Yii2 dumps PHP variables into your log files. Turn it off.
tags: ["tech", "craft-cms", "yii2"]
date: "2019-05-22T15:18:00.000+0200"
published: true
changelog:
  - date: "2019-05-22T15:18:00.000+0200"
    message: "Published"
---

Yii2 dumps `'_GET'`, `'_POST'`, `'_FILES'`, `'_COOKIE'`, `'_SESSION'`, `'_SERVER'` PHP variables to the logs after each request:

```
2019-05-22 06:24:44 [-][-][-][info][application] $_GET = []

$_POST = []

$_FILES = []

$_COOKIE = []

$_SERVER = [
    'HTTP_USER_AGENT' => 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:66.0) Gecko/20100101 Firefox/66.0'
    'HTTP_ACCEPT' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'HTTP_ACCEPT_LANGUAGE' => 'en-ZA,en-GB;q=0.8,en-US;q=0.5,en;q=0.3'
    'HTTP_ACCEPT_ENCODING' => 'gzip, deflate'
    'HTTP_DNT' => '1'
    'HTTP_CONNECTION' => 'keep-alive'
    'HTTP_UPGRADE_INSECURE_REQUESTS' => '1'
    'HTTP_CACHE_CONTROL' => 'max-age=0'
    'PATH' => '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin'
'
    'SERVER_SOFTWARE' => 'Apache/2.4.38 (Ubuntu)'
    ...
]

```

Urgh!

Let's remove them from our logs. Update your `config/app.php` to include the `log` component:

```php
<?php
use craft\log\FileTarget;
use yii\log\Logger;

return [
    'modules' => [
        // ...
    ],
    'components' => [
        // highlight-start
        'log' => [
            'targets' => [
                [
                    'class' => FileTarget::class,
                    'levels' => Logger::LEVEL_INFO
                        | Logger::LEVEL_WARNING
                        | Logger::LEVEL_ERROR,
                    'logFile' => '@storage/logs/web.log',
                    'logVars' => [],
                ],
            ],
        ],
        // highlight-end
    ],
    'bootstrap' => [/* ... */],
];
```

`FileTarget` is the default log target used by Craft. If we want to keep the log output in default location, we need to specify the other log options:

- `class` - The log target
- `levels` - A bitmap of all required log levels
- `logFile` - An aliased path to your log file

To limit which PHP variables are logged, set `logVars` to `['_GET', '_POST']` or any subset of the variables you like.

Now when you tail your logs, they aren't polluted with extraneous data.
