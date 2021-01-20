---
layout: blog.pug
title: DigitalOcean Dynamic Inventory
description: Writing a bash script to generate dynamic Ansible inventory for DigitalOcean using jq.
tags: ["post", "tech", "development", "ops"]
date: "2019-07-18"
---

An Ansible [inventory plugin](https://docs.ansible.com/ansible/latest/plugins/inventory.html#inventory-plugins) for DigitalOcean does not yet exist. Fortunately, with some bash scripting and the help of [jq](https://stedolan.github.io/jq/), we can write a script which generates an inventory for us.

If we had the following set of servers:

| Server Name   | Public IPv4    | Private IPv4  | Tags                 |
| ------------- | -------------- | ------------- | -------------------- |
| appserver-a   | 100.65.89.4    | 10.100.101.90 | `role-appserver`     |
| appserver-b   | 100.65.89.10   | 10.100.101.23 | `role-appserver`     |
| appserver-c   | 100.65.89.24   | 10.100.101.99 | `role-appserver`     |
| database-a    | 100.202.73.9   | 10.200.4.187  | `role-database`      |
| load-balancer | 100.200.33.196 | 10.200.4.136  | `role-load-balancer` |

A static Ansible inventory file could look like

```ini:title=static-inventory
[appservers]
100.65.89.4     internal_ip=10.100.101.90
100.65.89.10    internal_ip=10.100.101.23
100.65.89.24    internal_ip=10.100.101.99

[databases]
100.202.73.9    internal_ip=10.200.4.187

[load-balancer]
100.200.33.196  internal_ip=10.200.4.136
```

Servers come and go, and keeping track of them in this manner is no fun.

## The script

```bash:title=dynamic-inventory.sh
#!/bin/bash

json=$(
  curl -s -X GET \
  https://api.\digitalocean.com/v2/droplets \
  -H "Authorization: Bearer ${DO_TOKEN}"
)

filter_droplets () {
  result=$(
    echo "${1}" \
    | jq --arg role $2 '
        .droplets
        | .[]
        | select(.tags[] == $role)
        | .networks.v4
        | [
          (.[] | select(.type == "public") | .ip_address),
          (.[] | select(.type == "private") | .ip_address)
        ]'
  )
}

filter_droplets "${json}" role-appserver
appservers="${result}"

filter_droplets "${json}" role-database
databases="${result}"

filter_droplets "${json}" role-load-balancer
load_balancer="${result}"

meta_hostvars=$(
  echo "${appservers} ${load_balancer} ${databases}" \
  | jq -s '
    .
    |= [
      (
        .[]
        | {
            (.[0]): { "internal_ip": .[1] }
          }
      )
    ]
    | add'
)

jq '.' << EOH
{
  "appservers": {
    "hosts": $(echo "${appservers}" | jq -s '. | [(.[] | first)]')
  },
  "load_balancer": {
    "hosts": $(echo "${load_balancer}" | jq -s '. | [(.[] | first)]')
  },
  "databases": {
    "hosts": $(echo "${databases}" | jq -s '. | [(.[] | first)]')
  },
  "_meta": {
    "hostvars": ${meta_hostvars}
  }
}
EOH
```

To execute the script, first make sure the `DO_TOKEN` variable is set with your personal access token:

```bash
export DO_TOKEN=<your digitalocean personal access token>
./dynamic-inventory.sh
```

The output should look similar to this:

```json:title=Results
{
  "appservers": {
    "hosts": [
      "100.65.89.4",
      "100.65.89.10",
      "100.65.89.24",
    ]
  },
  "load_balancer": {
    "hosts": [
      "100.200.33.196"
    ]
  },
  "databases": {
    "hosts": [
      "100.202.73.9"
    ]
  },
  "_meta": {
    "hostvars": {
      "100.65.89.4": {
        "internal_ip": "10.100.101.90"
      },
      "100.65.89.10": {
        "internal_ip": "10.100.101.23"
      },
      "100.65.89.24": {
        "internal_ip": "10.100.101.99"
      },
      "100.202.73.9": {
        "internal_ip": "10.200.4.187"
      },
      "100.200.33.196": {
        "internal_ip": "10.200.4.136"
      }
    }
  }
}
```

To use it for a playbook, supplement the static inventory with a path to the script file:

```bash
ansible-playbook --inventory=dynamic-inventory.sh my-playbook.yml
```

## How it works

```bash:title=Fetch all droplets
json=$(
  curl -s -X GET \
  https://api.\digitalocean.com/v2/droplets \
  -H "Authorization: Bearer ${DO_TOKEN}"
)
```

Fetch a list of all available droplets.

```bash:title=filter_droplets
filter_droplets () {
  result=$(
    echo "${1}" \
    | jq --arg role $2 '
        .droplets
        | .[]
        | select(.tags[] == $role)
        | .networks.v4
        | [
          (.[] | select(.type == "public") | .ip_address),
          (.[] | select(.type == "private") | .ip_address)
        ]'
  )
}
```

Pipe JSON data into a jq filter which filters droplets based on a role (`role-appserver`, `role-database`, `role-load-balancer`) and returns a list of arrays in the format `[ <public ip>, <private ip> ]`.

```json:title=Example filter_droplets result
[
  "100.202.73.9",
  "10.200.4.187"
]
[
  "100.200.33.196",
  "10.200.4.136"
]
```

```base:title=Set group data
filter_droplets "${json}" role-appserver
appservers="${result}"

filter_droplets "${json}" role-database
databases="${result}"

filter_droplets "${json}" role-load-balancer
load_balancer="${result}"
```

Set server group data from results of the `filter_droplets` function call.

```bash:title=_meta.hostvars
meta_hostvars=$(
  echo "${appservers} ${load_balancer} ${databases}" \
  | jq -s '
    .
    |= [
      (
        .[]
        | {
            (.[0]): { "internal_ip": .[1] }
          }
      )
    ]
    | add'
)
```

Setup the `_meta` property by piping the joined lists of all the server groups into jq and using the slurp (`-s`) option to generate valid JSON. The jq filter will create key/value pairs where the key is the public ip (`.[0]`) and the value is an object containing the private ip (`{"internal_ip": .[1]}`). `add` merges the the array of key/value pairs into a single object.

Finally we generate the JSON output.

```bash:title=Public IP for hosts
  "appservers": {
    "hosts": $(echo "${appservers}" | jq -s '. | [(.[] | first)]')
  },
```

Once again slurp the list of IP arrays to create a valid JSON array of arrays, and for each sub-array, use the first item.
