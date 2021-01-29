---
layout: blog.pug
title: Load a dotenv file with bash
tags: ["post", "tech", "development"]
date: "2021-01-29"
---

```bash
cat .env << EOF
ENV_VAR_A=Variable A
ENV_VAR_B=Variable B
EOF

export $( \
  cat .env \
  | awk '!/(^#)|(^$)/ { print }' \
  | sed 's/#.*$//' | xargs \
)

echo $ENV_VAR_A
# Variable A
echo $ENV_VAR_B
# Variable B
```
