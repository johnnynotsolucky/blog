---
layout: blog.pug
title: Correlating Craft 3 requests, pt. 2
description: Forwarding request IDs and user support.
tags: ["post", "tech", "development", "craft-cms", "yii2"]
date: "2019-06-14T22:59:00.000+0200"
---

- [Correlating Craft 3 requests, pt. 1](/posts/correlate-requests/)

In part 1 we looked at how to quickly set up and configure a Monolog Processor to attach a request ID to our logs. In part 2, we'll implement our own processor and look at what else we can use the request ID for.

The goal here is that for a single request, we need the same request ID to be available throughout the application. We can do this in Craft by creating a [Module](https://docs.craftcms.com/v3/extend/module-guide.html), or updating one if you already have one. For this post, I'm assuming the module class is `Module` in the namespace `modules\sitemodule`.

## Building our own processor

To start, we'll need to install the `ramsey/uuid` package so we can generate UUIDs instead of random bytes.

```bash
composer require ramsey/uuid
```

Next we'll add our own processor to `modules\site-module\RequestIdProcessor.php`

```php
<?php
namespace modules\sitemodule;

use Monolog\Processor\ProcessorInterface;
use Ramsey\Uuid\UuidFactory;

class RequestIdProcessor implements ProcessorInterface
{
    private $requestId;

    public function __construct()
    {
        $factory = new UuidFactory();
        $this->requestId = $factory->uuid4()->toString();
    }

    public function __invoke(array $record): array
    {
        if (!isset($record['context'])) {
            $record['context'] = [];
        }

        $record['context']['request_id'] = $this->requestId;
        return $record;
    }

    public function getRequestId(): string
    {
        return $this->requestId;
    }
}
```

When this class is instantiated we generate a new UUID. `__invoke` is called for each log message in the queue and attaches the request ID. Previously, the `UidProcessor` added the request ID to the `"extra"` property, but since `yii2-psr-log-target` is already using a `"context"` property, we add it to that so we don't pollute our logs.

In `modules/site-module/Module.php`, we can add an instance property which would store a reference to the RequestIdProcessor. RequestIdProcessor won't instantiated in the Module class however. We'll see why shortly.

```php
<?php
namespace modules\sitemodule;

use Craft;

class Module extends \yii\base\Module
{
    // highlight-start
    public $requestIdProcessor;
    // highlight-end

    public function init()
    {
        Craft::setAlias('@modules', __DIR__);

        parent::init();

        // ...
    }
}
```

Finally, in `config/app.php` we tie it all together:

```php
<?php

use Craft;
use yii\log\Logger as YiiLogger;
use samdark\log\PsrTarget;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use modules\sitemodule\Module;
use modules\sitemodule\RequestIdProcessor;

$logger = new Logger('website');
$stream = new StreamHandler(Craft::getAlias('@storage/logs/web.log'));

$logger->pushHandler($stream);

// highlight-start
$requestIdProcessor = new RequestIdProcessor();
$logger->pushProcessor($requestIdProcessor);
// highlight-end

return [
    'modules' => [
        // highlight-start
        'site-module' => [
            'class' => \modules\sitemodule\Module::class,
            'requestIdProcessor' => $requestIdProcessor,
        ],
        // highlight-end
    ],
    'bootstrap' => ['site-module'],
    'components' => [
        'log' => [
            'targets' => [
                [
                    'class' => PsrTarget::class,
                    'logger' => $logger,
                ],
            ],
        ],
    ],
];
```

Because we want to access the request ID during execution of the request, but outside of the logging, we need to keep a reference to it. However, `config/app.php` is loaded before any modules or plugins are instantiated, so we need to tell Craft to set the `requestIdProcessor` property during instantiation.

Now instead of a short random string, we're logging a UUID.

```markup
[2019-06-14 05:13:22] website.INFO: Message A {"request_id":"38249a5d-bdd1-4bed-8bb7-07d0008f9c2e"} []
[2019-06-14 05:13:22] website.INFO: Message B {"request_id":"38249a5d-bdd1-4bed-8bb7-07d0008f9c2e"} []
[2019-06-14 05:13:22] website.INFO: Message C {"request_id":"38249a5d-bdd1-4bed-8bb7-07d0008f9c2e"} []
```

## Forwarding the request ID

When your site starts to grow, you might find yourself splitting out services into their own infrastructure. When these services start talking to each other, it becomes more difficult to trace user actions through the system as a whole. Even with request IDs attached to log messages, you would still be limited to focusing on individual services, instead of correlating across the entire system.

One solution is to set the `"X-Request-Id"` HTTP header (assuming we're using HTTP) on all outgoing requests to other services, and in those services, retrieve the ID from the header, and if its set, instead of genearting a new ID, use the forwarded one.

In `modules\site-module\RequestIdProcessor.php` update the constructor to check for the `"X-Request-Id"` header:

```php
public function __construct()
{
    if (isset($_SERVER['HTTP_X_REQUEST_ID'])) {
        $this->requestId = $_SERVER["HTTP_X_REQUEST_ID"];
    } else {
        $factory = new UuidFactory();
        $this->requestId = $factory->uuid4()->toString();
    }
}
```

Any requests coming in with that header set will automatically set the current request ID to the headers value.

Test it using Postman or curl:

```bash
curl -H "X-Request-Id: my-super-unique-id" my-site.local
```

Your logs should print something like this:

```markup
[2019-06-14 05:24:22] website.INFO: Message A {"request_id":"my-super-unique-id"} []
[2019-06-14 05:24:22] website.INFO: Message B {"request_id":"my-super-unique-id"} []
[2019-06-14 05:24:22] website.INFO: Message C {"request_id":"my-super-unique-id"} []
```

Let's test forwarding the ID on to other services. If we had some code which talks to another web service and we're using Guzzle, we can add a Guzzle middleware to automatically attach the request ID to all requests made by that client:

```php
use GuzzleHttp\Client;
use GuzzleHttp\Handler\CurlHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use Psr\Http\Message\RequestInterface;

...

$stack = new HandlerStack();
$stack->setHandler(new CurlHandler());

$stack->push(function (callable $handler) {
    return function (
        RequestInterface $request,
        array $options
    ) use ($handler) {
        $request = $request->withHeader(
            'X-Request-Id',
            Module::getInstance()->requestIdProcessor->getRequestId()
        );

        return $handler($request, $options);
    };
});

$client = new Client(['handler' => $stack]);
```

With the middleware in place, we can safely assume all calls with that client will have the correct request ID attached:

```php
$response = $client->get('https://postman-echo.com/get');

$body = json_decode($response->getBody());

$echoIdHeader = $body->headers->{'x-request-id'};
Craft::info(
    "Response: {$echoIdHeader}",
    __METHOD__
);
```

Running this, we can see Postman Echo replies with the request ID we sent it:

```markup
[2019-06-14 05:30:27] website.INFO: Response: faff6104-a9c1-43b9-ab62-962ef4122b2d {"request_id":"faff6104-a9c1-43b9-ab62-962ef4122b2d"} []
```

And pass on an ID:

```bash
curl -H "X-Request-Id: my-super-unique-id" my-site.local
```

```markup
[2019-06-14 05:30:57] website.INFO: Response: my-super-unique-id {"request_id":"my-super-unique-id"} []
```

## User support

When there's a system error, it can be useful to pass the user their request ID and hopefully they would let you know, and send the ID along too.

A quick solution would be to create a Craft variable and use it on your error page, or if you're running Craft in headless mode, you can include the ID in your error responses.
