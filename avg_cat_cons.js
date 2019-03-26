require("dotenv").config();
const axios = require("axios");

async function authenticate() {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "basiq-version": "2.0",
      Authorization: `Basic ${process.env.API_KEY}`
    },
    url: `${process.env.BASE_URL}/token`
  };
  try {
    const response = await axios(options);
    const access_token = response.data.access_token;
    return access_token;
  } catch (e) {
    console.log(e.response.data.data);
  }
}

async function createUser(access_token) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`
    },
    data: {
      email: "stefanacerovina@gmail.com",
      mobile: "+381694843390"
    },
    url: `${process.env.BASE_URL}/users`
  };

  try {
    const response = await axios(options);
    const user_id = response.data.id;
    return user_id;
  } catch (e) {
    console.log(e.response.data.data);
  }
}

async function createConnection(access_token, user_id) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`
    },
    url: `${process.env.BASE_URL}/users/${user_id}/connections`,
    data: {
      loginId: "gavinBelson",
      password: "hooli2016",
      institution: {
        id: "AU00000"
      }
    }
  };
  try {
    const response = await axios(options);
    return response.data.links.self;
  } catch (e) {
    console.log(e.response.data.data);
  }
}

async function refreshConnection(access_token, user_id, connection_id) {
  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`
    },
    url: `${
      process.env.BASE_URL
    }/users/${user_id}/connections/${connection_id}/refresh`
  };
  try {
    const response = await axios(options);
    return response.data.links.self;
  } catch (e) {
    console.log(e.response.data.data);
  }
}

async function checkTransactionsStatus(url, access_token) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`
    },
    url: url
  };
  const response = await axios(options);
  const status = response.data.steps[2].status;
  if (status === "success") {
    return response.data.steps[2].result.url;
  } else return response.data.steps[2].result;
}

async function getTransactions(url, access_token) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`
    },
    url: `${process.env.BASE_URL}${url}`
  };
  try {
    const response = await axios(options);
    return response.data.data;
  } catch (e) {
    console.log(e.response.data.data);
  }
}

function getAveragePayments(token, job_url) {
  let trans_url = null;
  let counter = 0;

  let intr = setInterval(async function() {
    trans_url = await checkTransactionsStatus(job_url, token);
    counter++;
    if (counter > 20) {
      clearInterval(intr);
    }
    if (trans_url !== null) {
      setTimeout(async function() {
        getTransactions(trans_url, token).then(transactions => {
          let categories = {};
          for (let i = 0; i < transactions.length; i++) {
            if (transactions[i].subClass) {
              let cat = transactions[i].subClass.code;
              if (!(cat in categories)) {
                categories[cat] = {
                  title: transactions[i].subClass.title,
                  totalAmount: Math.abs(transactions[i].amount),
                  numberOfTransactions: 1
                };
              } else {
                categories[cat]["totalAmount"] += Math.abs(
                  transactions[i].amount
                );
                categories[cat]["numberOfTransactions"] += 1;
              }
            }
          }
          for (let cat in categories) {
            console.log(
              "Category: ",
              categories[cat]["title"],
              "Average payments: ",
              Math.round(
                (categories[cat]["totalAmount"] * 1.0) /
                  categories[cat]["numberOfTransactions"]
              )
            );
          }
        });
      }, 0);
      clearInterval(intr);
    }
  }, 15000);
}

if (process.env.API_KEY === "") {
  console.log("Please set valid API_KEY");
} else {
  authenticate().then(token => {
    //If provided user_id and connection_id, do not create new
    if (process.argv[2] && process.argv[3]) {
      let arg1 = process.argv[2].split("=");
      let arg2 = process.argv[3].split("=");
      if (arg1[0] === "user_id" && arg2[0] === "connection_id") {
        let user_id = arg1[1];
        let connection_id = arg2[1];
        refreshConnection(token, user_id, connection_id).then(job_url => {
          getAveragePayments(token, job_url);
        });
      } else {
        console.log("You should provide both userID and connectionID");
      }
    } else {
      createUser(token).then(user_id =>
        createConnection(token, user_id).then(job_url => {
          getAveragePayments(token, job_url);
        })
      );
    }
  });
}
