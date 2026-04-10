import express from 'express';
import {matchRouter} from "./routes/matches.js";

const app = express();
const port = 8000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Express server started');
})

app.use('/matches', matchRouter)

app.listen(port, () => {
    console.log(`Express server started at localhost:${port}`);
})