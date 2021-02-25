---
layout: blog.pug
title: Add an admin user to a Craft site
description: A snippet to a new admin user to a Craft project with the Craft shell
tags: ["post", "tech", "development", "craftcms"]
date: "2021-02-25"
---

The Craft shell is only available if the yii2-shell package is installed:

```bash
composer require --dev yiisoft/yii2-shell
```

Start the shell:

```bash
./craft shell
```

Execute the command:

```php
Craft::$app->elements->saveElement(new \craft\elements\User([
  'username' => '<username>',
  'email' => '<email>',
  'newPassword' => '<password>',
  'admin' => true,
  'passwordResetRequired' => false,
]));
```

