const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const { connectDatabase } = require("./config/database");

const port = process.env.PORT || 3000;

connectDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error(`Unable to start server: ${error.message}`);
        process.exitCode = 1;
    });
