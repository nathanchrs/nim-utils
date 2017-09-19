# nim-utils

Utilities for obtaining public ITB student data.

## Instructions

Prerequisites: Node.js, your ITB NIC session cookie.

1. Clone this repository.
2. `npm install`
3. Copy `config.json.example` to `config.json`, then add your ITB NIC session cookie for `session_cookie_value`.

### How to get your ITB NIC session cookie

1. Go to https://nic.itb.ac.id on your browser.
2. Use the `Network` or `Storage` tab on your browser's developer tools to see the cookies stored for the page.
3. Locate a cookie with its name containing a `SSESS` prefix.
4. Copy its value for your `session_cookie_value` configuration key.
