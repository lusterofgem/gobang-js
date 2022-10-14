const express = require("express");

const port = 8080;

const app = express();
app.listen(port, ()=> {
    console.log(`listening on port ${port}`);
});

app.get("/", (req, res) => {
    res.send("hello, world");
});
