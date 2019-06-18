---
title: Grokkable logs w/ Craft 3, pt. 2
description: JSON formatting and parsing
tags: ["tech", "development", "craft-cms", "yii2"]
date: "2019-06-16T18:30:00.000+0200"
published: false
changelog:
  - date: "2019-06-16T18:30:00.000+0200"
    message: "Published"
---

- [Grokkable logs w/ Craft 3, pt. 1](/grokkable-logs)

In Part 1 we had a look at how we can set up a more versatile method for logging. Now let's add a JSON formatter, and see how this is beneficial.

Formatting can be set on any Monolog handler which implements the [FormattableHandlerInterface](https://github.com/Seldaek/monolog/blob/4a33226f25009758cb237b4383589cef023b9494/src/Monolog/Handler/FormattableHandlerInterface.php). To change the formatting we need to call the handlers `setFormatter()` function with the formatter we need:

```php:title=config/app.php
<?php

use Craft;
use yii\log\Logger as YiiLogger;
use samdark\log\PsrTarget;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
// highlight-start
use Monolog\Formatter\JsonFormatter;
// highlight-end

$logger = new Logger('my-site');
$stream = new StreamHandler(Craft::getAlias('@storage/logs/web.log'));
// highlight-start
$stream->setFormatter(new JsonFormatter());
// highlight-end
$logger->pushHandler($stream);

...
```

After updating the app config, our logs will look like this:

```markup
{"message":"Message A","context":{"timestamp":1560800484.405144},"level":200,"level_name":"INFO","channel":"website","datetime":{"date":"2019-06-17 12:41:24.422948","timezone_type":3,"timezone":"America/Los_Angeles"},"extra":[]}
{"message":"Message B","context":{"timestamp":1560800484.405156},"level":200,"level_name":"INFO","channel":"website","datetime":{"date":"2019-06-17 12:41:24.423069","timezone_type":3,"timezone":"America/Los_Angeles"},"extra":[]}
{"message":"Message C","context":{"timestamp":1560800484.405161},"level":200,"level_name":"INFO","channel":"website","datetime":{"date":"2019-06-17 12:41:24.423136","timezone_type":3,"timezone":"America/Los_Angeles"},"extra":[]}
```

OK, well that's not actually better. We're back at spending mental effort to parse these visually and filtering with grep might require some gymnastics.

[jq](https://github.com/stedolan/jq) is a command-line JSON processor, and with its help we can do some really cool things with our logs.

```bash:title=Basic jq execution
jq '.' /path/to/storage/logs/web.log
```

In it's simplest form, jq takes a filter and a file to parse. The output would be something like this:

```json:title=JSON formatted log messages
{
  "message": "Message A",
  "context": {
    "timestamp": 1560800484.405144
  },
  "level": 200,
  "level_name": "INFO",
  "channel": "website",
  "datetime": {
    "date": "2019-06-17 12:41:24.422948",
    "timezone_type": 3,
    "timezone": "America/Los_Angeles"
  },
  "extra": []
}
{
  "message": "Message B",
  "context": {
    "timestamp": 1560800484.405156
  },
  "level": 200,
  "level_name": "INFO",
  "channel": "website",
  "datetime": {
    "date": "2019-06-17 12:41:24.423069",
    "timezone_type": 3,
    "timezone": "America/Los_Angeles"
  },
  "extra": []
}
{
  "message": "Error A",
  "context": {
    "timestamp": 1560800484.405161
  },
  "level": 400,
  "level_name": "ERROR",
  "channel": "website",
  "datetime": {
    "date": "2019-06-17 12:41:24.423136",
    "timezone_type": 3,
    "timezone": "America/Los_Angeles"
  },
  "extra": []
}
```

This is better; we can easily scan over messages and gain insights without too much effort. jq also uses a streaming parser, so we can pipe log messages in:

```bash:title=Pipe log messages to jq
tail -f -n0 /path/to/storage/logs/web.log | jq '.'
```

Quick note on the `datetime` field:

> _`addTimestampToContext` tells PsrTarget to log the time the log was created. The timestamp in the log file is the time that the logs were written to disk, this argument adds an extra field with the real timestamp._

## Examples

```bash:title=Filter by field
jq 'select(.level == 400)' storage/logs/web.log

{
  "message": "Error A",
  "context": {
    "timestamp": 1560803946.578406
  },
  "level": 400,
  "level_name": "ERROR",
  "channel": "website",
  "datetime": {
    "date": "2019-06-17 12:41:24.423136",
    "timezone_type": 3,
    "timezone": "America/Los_Angeles"
  },
  "extra": []
}
```

```bash:title=Remove fields; set root-level timestamp
jq '
  . + {timestamp: .context.timestamp} |
  del(.context) |
  del(.datetime) |
  del(.extra)
' storage/logs/web.log

{
  "message": "Message B",
  "level": 200,
  "level_name": "INFO",
  "channel": "website",
  "timestamp": 1560803945.701792
}
{
  "message": "Error A",
  "level": 400,
  "level_name": "ERROR",
  "channel": "website",
  "timestamp": 1560803946.578406
}
```

Sorting is possible, but it requires the slurp (`-s`) flag which reads loads the entire log into an array and applies your filters to it.

```bash:title=Sort by field value
jq -s 'sort_by(.context.timestamp)' storage/logs/web.log
```

Sometimes its useful to log data in your messages:

```bash:title=Print a single field
jq '{message}' storage/logs/web.log

{
  "message": "{\"item\":\"A\"}"
}
```

We'd like to have that formatted as JSON as well:

```bash:title=Parse JSON string in field
jq '.message |= fromjson' storage/logs/web.log

{
  "message": {
    "item": "A"
  },
  "context": {
    "timestamp": 1560806240.919656
  },
  "level": 200,
  "level_name": "INFO",
  ...
}
```

This falls over if there are non-JSON strings in the message field however:

```markup:title=Unable to parse regular string
jq: error (at storage/logs/web.log:22): Invalid numeric literal at line 1, column 8 (while parsing 'Message B')
```

To resolve that, we can add a bit of extra filter logic to print out JSON and non-JSON messages:

```bash{4-6,15}:title=Format only JSON strings
jq '.message |= (. as $message | try (. | fromjson) catch $message)' storage/logs/web.log

{
  "message": {
    "item": "A"
  },
  "context": {
    "timestamp": 1560807039.290833
  },
  "level": 200,
  "level_name": "INFO",
  ...
}
{
  "message": "Message B",
  "context": {
    "timestamp": 1560807039.290841
  },
  "level": 200,
  "level_name": "INFO",
  ...
}
```

You'll probably find that you'll be repeating the same queries, I suggest adding them to your `bash_profile`/`.bashrc`/whatever file.

You should check out the [docs](https://stedolan.github.io/jq/manual/), they are quite extensive. There is also a [cookbook](https://github.com/stedolan/jq/wiki/Cookbook).

JSON logs are useful when you're using something like Elastic Stack to store your logs. For example you can use the [JSON filter](https://www.elastic.co/guide/en/logstash/current/plugins-filters-json.html) for LogStash to simplify your filters.
