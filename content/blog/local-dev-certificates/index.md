---
title: Naive guide to generating development certificates
description: Generate your own certificates for development (the hard way)
tags: ["tls", "ops", "development", "tricks"]
date: "2019-06-10T22:27:00.000+0200"
---

The easy way: [mkcert](https://github.com/FiloSottile/mkcert).

Recently I was working on an Ansible role to provision Nginx with TLS already configured and enabled, however to test it effectively, I needed to have valid certificates installed in the testing container. This was my brief foray into OpenSSL.

# Setting up

Before we can set up a CA and start signing certificates, there are a few requirements. We need a place to store the certificates, we need some configuration, and we need a database for CA lookups. Fortunately, that is all readily available.

Create a directory somewhere on your machine where you'd like your certificates to be stored:

```bash
mkdir -p ~/.local/share/certs
cd ~/.local/share/certs
```

Add in your OpenSSL configuration, here's the config I used to generate my certicates for the Ansible role:

`gist:johnnynotsolucky/4439a59e4b87727b624c47294152d635`

When generating a signed certificate with `openssl ca`, OpenSSL will try to update a database file which, depending on your configuration, might be `index.txt`.

```bash
touch index.txt
```

# Create a Certificate Authority

First generate a key:

```bash
openssl genrsa -out ca.key 2048
```

Then create a certificate signed with that key:

```bash
openssl req -new -x509 -key ca.key -out ca.crt
```

**Note** that the key and certificate filenames are important here. They should match the names in your configuration file.

To avoid prompts when generating the certificate, an extra `-subj` argument can be passed:

```bash
openssl req -new -x509 -key ca.key -out ca.crt -subj "/C=ZA/ST=Western Cape/L=Cape Town/O=Bush Co/OU=Tech/CN=my-domain.dev"
```

The fields passed to the subject argument correspond with:

```
[C] Country Name (2 letter code) 	The two-letter country code where your company is legally located.
[ST] State or Province Name (full name) 	The state/province where your company is legally located.
[L] Locality Name (e.g., city) 	The city where your company is legally located.
[O] Organization Name (e.g., company) 	Your company's legally registered name (e.g., YourCompany, Inc.).
[OU] Organizational Unit Name (e.g., section) 	The name of your department within the organization. (You can leave this option blank; simply press Enter.)
[CN] Common Name (e.g., server FQDN) 	The fully-qualified domain name (FQDN) (e.g., www.example.com).
```

# Generate your certificate

Create your site key:

```bash
openssl genrsa -out localhost.key 2048
```

Generate a signing request:

```bash
openssl req -new -key localhost.key -out localhost.csr -subj "/C=ZA/ST=Western Cape/L=Cape Town/O=Bush Co/OU=Tech/CN=localhost"
```

And finally, sign the key and generate your certificate:

```bash
openssl ca -config openssl.cnf -in localhost.csr -out localhost.cer -create_serial -batch
```

# Using the certificates

## Install your CA on Firefox

In Firefox, navigate to Preferences -> Privacy & Security -> Certificates. Click "View Certificates" and under "Authorities" click Import and import your `ca.crt` file.

## Nginx

In your vhosts file for your site:

```
ssl_certificate_path: "/etc/path/to/your/localhost.cer"
ssl_certificate_key_path: "/etc/path/to/your/localhost.key"
```

## curl

In my case, I was using [Molecule](https://molecule.readthedocs.io/en/stable/) which runs tests against a Docker container. I needed to make a call to my test site over TLS and verify the response:

```bash
curl --cacert /etc/path/to/my/ca.crt -I -H "Host: test.dev" https://localhost

HTTP/2 200
date: Mon, 10 Jun 2019 20:22:57 GMT
expires: Wed, 10 Jul 2019 20:22:57 GMT
server: nginx
x-xss-protection: 0
x-frame-options: SAMEORIGIN
...
```

To dive into more details around setting up a CA, [Igor Soarez](https://github.com/soarez) has an in-depth guide here: [https://gist.github.com/Soarez/9688998](https://gist.github.com/Soarez/9688998).
