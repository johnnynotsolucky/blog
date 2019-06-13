---
title: Correlating Craft 3 requests
description: Add a request ID to your logs for easy log grouping.
tags: ["tech", "development", "craft-cms", "yii2"]
date: "2019-06-13T23:25:00.000+0200"
published: true
changelog:
  - date: "2019-06-13T23:25:00.000+0200"
    message: "Published"
---

Sometimes when debugging issues, its useful to group log messages together by a request identifier so that we can follow a requests flow through our system. This is especially useful when tracing calls on a site with hundreds or thousands of requests per minute.

With standard logging you could expect to see something like this where the flow through the application is broken up by multiple requests. You cannot reasonably make assumptions which request triggered the error.

```markup
[2019-06-13 13:03:17] website.INFO: Message A {"trace":[],"memory":1806456} []
[2019-06-13 13:03:17] website.INFO: Message B {"trace":[],"memory":1806832} []
[2019-06-13 13:03:17] website.INFO: Message A {"trace":[],"memory":1806456} []
[2019-06-13 13:03:17] website.INFO: Message A {"trace":[],"memory":1806456} []
[2019-06-13 13:03:17] website.INFO: Message C {"trace":[],"memory":1807208} []
[2019-06-13 13:03:17] website.INFO: Message C {"trace":[],"memory":1807208} []
[2019-06-13 13:03:17] website.INFO: Message B {"trace":[],"memory":1806832} []
[2019-06-13 13:03:17] website.INFO: Message C {"trace":[],"memory":1807208} []
[2019-06-13 13:03:17] website.ERROR: Error A {"trace":[],"memory":1807584} []
```

We can see that every request seems to flow from `"Message A"` → `"Message B"` → `"Message C"`, and in one of the requests `"Message B"` was skipped, which is likely the culprit. However, its not clear which series of events is actually causing the error. You would need to replay all three scenarios.

_In reality we would be logging considerably more valuable information._

If we attached a request ID to each log we'd know which request caused the problem and it would be trivial to filter out the rest.

Assuming you've [setup your logging to use Monolog](/grokkable-logs/), you can add a [Processor](https://github.com/Seldaek/monolog/blob/master/doc/02-handlers-formatters-processors.md#processors) to the logger. There are a bunch of processors already available, for this we'll be using the [UidProcessor](https://github.com/Seldaek/monolog/blob/master/src/Monolog/Processor/UidProcessor.php). It adds a `uid` property to the `extra` array on the log record.

Update `config/app.php` to include a Monolog processor:

```php
use Craft;
use yii\log\Logger as YiiLogger;
use samdark\log\PsrTarget;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
// highlight-start
use Monolog\Processor\UidProcessor;
// highlight-end

$logger = new Logger('website');
$stream = new StreamHandler(Craft::getAlias('@storage/logs/web.log'));
$logger->pushHandler($stream);

// highlight-start
$logger->pushProcessor(new UidProcessor(8));
// highlight-end
```

A processor is like middleware for logs. It is called for each log waiting in the queue to be handled. Here we are generating an 8 character random string and for each log, adding that to the `extra` property.

Let's see what our logs look like now:

```markup
[2019-06-13 14:21:17] website.INFO: Message A [] {"uid":"fb076319"}
[2019-06-13 14:21:17] website.INFO: Message B [] {"uid":"fb076319"}
[2019-06-13 14:21:17] website.INFO: Message A [] {"uid":"525d23a9"}
[2019-06-13 14:21:17] website.INFO: Message A [] {"uid":"93f82c73"}
[2019-06-13 14:21:17] website.INFO: Message C [] {"uid":"93f82c73"}
[2019-06-13 14:21:17] website.INFO: Message C [] {"uid":"fb076319"}
[2019-06-13 14:21:17] website.INFO: Message B [] {"uid":"525d23a9"}
[2019-06-13 14:21:17] website.INFO: Message C [] {"uid":"525d23a9"}
[2019-06-13 14:21:17] website.ERROR: Error A [] {"uid":"93f82c73"}
```

_Note_ I've removed the context property so the logs are a bit less verbose.

Now that we know how to identify the log sequence, we can group them with something like `grep "93f82c73" /path/to/logfile`:

```markup
[2019-06-13 14:21:17] website.INFO: Message A [] {"uid":"93f82c73"}
[2019-06-13 14:21:17] website.INFO: Message C [] {"uid":"93f82c73"}
[2019-06-13 14:21:17] website.ERROR: Error A [] {"uid":"93f82c73"}
```

Great, that looks better. Now (because we've logged useful data not just "Message A") we should be a bit more effective in our debugging.

