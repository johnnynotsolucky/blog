---
layout: blog.pug
title: Load a dotenv file with bash
tags: ["post", "tech", "development"]
date: "2021-01-29"
---

```bash
# Create the .env file.
cat .env << EOF
# Comment about variable A
ENV_VAR_A=Foo

ENV_VAR_B=Bar
EOF

# Export the contents as environment variables excluding comments and empty
# lines.
export $( \
  cat .env \
  | awk '!/(^#)|(^$)/ { print }' \
  | sed 's/#.*$//' | xargs \
)

echo $ENV_VAR_A
# Foo
echo $ENV_VAR_B
# Bar
```
