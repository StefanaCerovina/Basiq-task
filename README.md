# Basiq-task

This is a script that calculates average payments per each category for some user that is connected to sandbox bank AU00000.
You can either provide user id and connection id, or a new user and new connection will be created.

### Installing all dependencies
```
$npm install
```

### Setting API_KEY environment variable
Make .env file that looks like .env-example with real API_KEY

### Running
  #### 1. Providing an existing user
  ```
  $ node avg_cat_cons.js user_id="yourUserID" connection_id="yourConnectionID"
  ```
  
  #### 2. Creating a new user
  ```
  $ node avg_cat_cons.js
  ```
  
