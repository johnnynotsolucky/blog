---
title: Grokkable logs w/ Craft 3
description: Log messages in a format that is easy to work with
tags: ["tech", "development", "craft-cms", "yii2"]
date: "2019-06-11T18:30:00.000+0200"
changelog:
  - date: "2019-06-11T18:30:00.000+0200"
    message: "Published"
---

## The problem

By default, Yii2 logs are multiline and Craft doesn't add any extra configuration to change the log output beyond log file location. While this might be useful on a local dev environment when you have relatively few logs, it can quickly become tiresome to search. For example, let's take a look at a small sample of logs from a fresh Craft 3 installation:

```bash
less +F /path/to/storage/logs/web.log
```

```markup
2019-06-11 05:09:37 [-][-][-][info][yii\db\Command::query] SHOW FULL COLUMNS FROM `craft_resourcepaths`
2019-06-11 05:09:37 [-][-][-][info][yii\db\Command::query] SELECT
    kcu.constraint_name,
    kcu.column_name,
    ...truncated
    kcu.constraint_name = rc.constraint_name
WHERE rc.constraint_schema = database() AND kcu.table_schema = database()
AND rc.table_name = 'craft_resourcepaths' AND kcu.table_name = 'craft_resourcepaths'
2019-06-11 05:09:37 [-][-][-][info][yii\db\Command::query] SELECT
    kcu.constraint_name,
    kcu.column_name,
    kcu.referenced_table_name,
    kcu.referenced_column_name,
    rc.UPDATE_RULE,
    rc.DELETE_RULE
FROM information_schema.referential_constraints AS rc
JOIN information_schema.key_column_usage AS kcu ON
    (
        kcu.constraint_catalog = rc.constraint_catalog OR
        (kcu.constraint_catalog IS NULL AND rc.constraint_catalog IS NULL)
    ) AND
    kcu.constraint_schema = rc.constraint_schema AND
    kcu.constraint_name = rc.constraint_name
WHERE rc.constraint_schema = database() AND kcu.table_schema = database()
AND rc.table_name = 'craft_resourcepaths' AND kcu.table_name = 'craft_resourcepaths'
2019-06-11 05:09:37 [-][-][-][info][yii\db\Command::query] SELECT
    `kcu`.`CONSTRAINT_NAME` AS `name`,
    `kcu`.`COLUMN_NAME` AS `column_name`,
    ...truncated
FROM
    `information_schema`.`KEY_COLUMN_USAGE` AS `kcu`,
    `information_schema`.`REFERENTIAL_CONSTRAINTS` AS `rc`,
    `information_schema`.`TABLE_CONSTRAINTS` AS `tc`
WHERE
    `kcu`.`TABLE_SCHEMA` = COALESCE(NULL, DATABASE()) AND `kcu`.`CONSTRAINT_SCHEMA` = `kcu`.`TABLE_SCHEMA` AND `kcu`.`TABLE_NAME` = 'craft_resourcepaths'
    AND `rc`.`CONSTRAINT_SCHEMA` = `kcu`.`TABLE_SCHEMA` AND `rc`.`TABLE_NAME` = 'craft_resourcepaths' AND `rc`.`CONSTRAINT_NAME` = `kcu`.`CONSTRAINT_NAME`
    AND `tc`.`TABLE_SCHEMA` = `kcu`.`TABLE_SCHEMA` AND `tc`.`TABLE_NAME` = 'craft_resourcepaths' AND `tc`.`CONSTRAINT_NAME` = `kcu`.`CONSTRAINT_NAME` AND `tc`.`CONSTRAINT_TYPE` = 'FOREIGN KEY'
UNION
SELECT
    `kcu`.`CONSTRAINT_NAME` AS `name`,
    `kcu`.`COLUMN_NAME` AS `column_name`,
    `tc`.`CONSTRAINT_TYPE` AS `type`,
    ...truncated
FROM
    `information_schema`.`KEY_COLUMN_USAGE` AS `kcu`,
    `information_schema`.`TABLE_CONSTRAINTS` AS `tc`
WHERE
    `kcu`.`TABLE_SCHEMA` = COALESCE(NULL, DATABASE()) AND `kcu`.`TABLE_NAME` = 'craft_resourcepaths'
    AND `tc`.`TABLE_SCHEMA` = `kcu`.`TABLE_SCHEMA` AND `tc`.`TABLE_NAME` = 'craft_resourcepaths' AND `tc`.`CONSTRAINT_NAME` = `kcu`.`CONSTRAINT_NAME` AND `tc`.`CONSTRAINT_TYPE` IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY `position` ASC
2019-06-11 05:09:37 [-][-][-][info][yii\db\Command::query] SELECT
    `s`.`INDEX_NAME` AS `name`,
    `s`.`COLUMN_NAME` AS `column_name`,
    `s`.`NON_UNIQUE` ^ 1 AS `index_is_unique`,
    `s`.`INDEX_NAME` = 'PRIMARY' AS `index_is_primary`
FROM `information_schema`.`STATISTICS` AS `s`
WHERE `s`.`TABLE_SCHEMA` = COALESCE(NULL, DATABASE()) AND `s`.`INDEX_SCHEMA` = `s`.`TABLE_SCHEMA` AND `s`.`TABLE_NAME` = 'craft_resourcepaths'
ORDER BY `s`.`SEQ_IN_INDEX` ASC

```

Alright. Not so useful. However, that _is_ the point I'm illustrating; that it isn't really useful. You cannot simply scan through hundreds of entries without incurring the mental cost of scanning for the start and end of log entries.

The single line option for the `less` command is also unable to help. It truncates each line, but because we're logging multiple lines per entry, less won't improve the output much here.

As an example, we want to search for warnings. Simple right?

Let's log a warning:

```php
Craft::warning(
"Lorem ipsum dolor sit amet,
consectetur adipiscing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"
);

```

And search for it:

```bash
grep "\[warning\]" /path/to/storage/logs/web.log

2019-06-11 05:21:58 [-][-][-][warning][application] Lorem ipsum dolor sit amet,
```

🤔

There's another issue: Maybe you want to ship your logs off to some or other log aggregation service like ElasticStack? It gets a bit tricky here. If you're using FileBeats to send your logs off, there's no guarantee that each _log entry_ will be sent as a single entry because data is batched. We'd could end up with message sent to our aggregation service like this:

```markup
2019-06-11 05:09:37 [-][-][-][info][yii\db\Command::query] SELECT
    `s`.`INDEX_NAME` AS `name`,
    `s`.`COLUMN_NAME` AS `column_name`,
    `s`.`NON_UNIQUE` ^ 1 AS `index_is_unique`,
    `s`.`INDEX_NAME` = 'PRIMARY' AS `index_is_primary`
FROM `information_schema`.`STATISTICS` AS `s`
```

```markup
WHERE `s`.`TABLE_SCHEMA` = COALESCE(NULL, DATABASE()) AND `s`.`INDEX_SCHEMA` = `s`.`TABLE_SCHEMA` AND `s`.`TABLE_NAME` = 'craft_resourcepaths'
ORDER BY `s`.`SEQ_IN_INDEX` ASC
```

The problem is compounded when we start working with LogStash or equivalent to parse these entries:

- We need to tell LogStash how to parse our specific multiline logs - [https://www.elastic.co/guide/en/logstash/current/plugins-codecs-multiline.html](https://www.elastic.co/guide/en/logstash/current/plugins-codecs-multiline.html)
- Somehow, we need our aggregator to keep the tailing bits of our log entries that came through in separate messages

I care for neither of these things.

## A solution

Switch out Yii2's default logger with [Monolog](https://github.com/Seldaek/monolog).

Monolog implements the [PSR-3 Logger Interface](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-3-logger-interface.md) and exposes handlers for all variety of logging.

With Yii2, developers can implement their own logging functionality by implementing the `yii\log\Target` interface. Fortunately, there is already a [PsrTarget](https://github.com/samdark/yii2-psr-log-target) which integrates Yii2 logs with PSR-3 compatible loggers.

Install Monolog and PsrTarget:

```bash
composer require monolog/monolog samdark/yii2-psr-log-target
```

Now we can configure our logging. Set up your sites `config/app.php` file:

```php
<?php

use Craft;
use yii\log\Logger as YiiLogger;
use samdark\log\PsrTarget;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// highlight-start
$logger = new Logger('my-site');
$stream = new StreamHandler(Craft::getAlias('@storage/logs/web.log'));

$logger->pushHandler($stream);
// highlight-end

return [
    'modules' => [
        ...
    ],
    'bootstrap' => [
        ...
    ],
    'components' => [
        // highlight-start
        'log' => [
            'targets' => [
                [
                    'class' => PsrTarget::class,
                    'logger' => $logger,
                    'addTimestampToContext' => true,
                ],
            ],
        ],
        // highlight-end
    ],
];
```

Looking at this code, we're doing two things; First we're setting up Monolog, and second, pointing Craft at the PsrTarget.

Create a new Monolog channel called `'my-site'`. This can be anything. If you're not using multiple channels, call it `'application'` or use your sites name.

```php
$logger = new Logger('my-site');
```

Set up a log handler. We're using a `StreamHandler` to send all our logs to the same place Craft would usually. Monolog supports a range of handlers: [https://github.com/Seldaek/monolog/blob/master/doc/02-handlers-formatters-processors.md](https://github.com/Seldaek/monolog/blob/master/doc/02-handlers-formatters-processors.md).

```php
$stream = new StreamHandler(Craft::getAlias('@storage/logs/web.log'));
```

Tell the channel which handlers to use:

```php
$logger->pushHandler($stream);
```

Next we tell Craft which log target to use and pass in some arguments:

```php
'targets' => [
    [
        'class' => PsrTarget::class,
        'logger' => $logger,
        'addTimestampToContext' => true,
    ],
],
```

- `class` defines the log target which implements Yii2's Target interface.
- `logger` points to a PSR-3 compatible logger instance. This instance is pass through to the log target once it is instantiated by Yii2.
- `addTimestampToContext` tells PsrTarget to log the time the log was created. The timestamp in the log file is the time that the logs were written to disk, this argument adds an extra field with the real timestamp. This is more useful when shipping logs elsewhere.

## The result

Your logs should be much cleaner now. For example, running `less` with the single line flag, we can have a brief overview of whats happening in our site.

```bash
less -S +F /path/to/storage/logs/web.log
```

```markup{4}
[2019-06-11 07:27:06] my-site.DEBUG: Running action: craft\controllers\TemplatesController::actionRender() {"trace":[],"memory":313
[2019-06-11 07:27:06] my-site.DEBUG: Rendering template:  {"trace":[],"memory":3364080,"category":"craft\\web\\View::renderTemplate
[2019-06-11 07:27:48] my-site.DEBUG: Loading module: my-module {"trace":[],"memory":1896192,"category":"yii\\base\\Module::getModul
[2019-06-11 07:27:48] my-site.WARNING: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
[2019-06-11 07:27:48] my-site.DEBUG: Bootstrap with modules\Module {"trace":[],"memory":1911640,"category":"yii\\base\\Application:
[2019-06-11 07:27:48] my-site.DEBUG: [     'rule' => 'Token',     'match' => false,     'parent' => null, ] {"trace":[],"memory":30
[2019-06-11 07:27:48] my-site.DEBUG: [     'rule' => 'Element URI: ',     'match' => false,     'parent' => null, ] {"trace":[],"me
[2019-06-11 07:27:48] my-site.DEBUG: [     'rule' => 'Template: ',     'match' => true,     'parent' => null, ] {"trace":[],"memory
[2019-06-11 07:27:48] my-site.DEBUG: Route requested: 'templates/render' {"trace":[],"memory":3034896,"category":"yii\\web\\Applica
[2019-06-11 07:27:48] my-site.DEBUG: Route to run: templates/render {"trace":[],"memory":3132472,"category":"yii\\base\\Controller:
```

And now if we grep for warnings again, we should get something useful out:

```bash
grep "my-site.WARNING" /path/to/storage/logs/web.log

[2019-06-11 07:27:06] my-site.WARNING: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
  labore et dolore magna aliqua {"trace":[],"memory":1972792,"category":"application","timestamp":1560263224.855803} []
[2019-06-11 07:27:48] my-site.WARNING: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
  labore et dolore magna aliqua {"trace":[],"memory":1903496,"category":"application","timestamp":1560263267.470124} []
[2019-06-11 07:30:34] my-site.WARNING: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
  labore et dolore magna aliqua {"trace":[],"memory":1903496,"category":"application","timestamp":1560263432.649095} []
```

👌
