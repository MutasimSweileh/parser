import express from 'express';
import Parser from '@postlight/parser';
import logger from 'logops';
import morgan from 'morgan';

const app = express()


const port = process.env.PORT || 3000;

//app.use(expressLogging(logger));
app.use(morgan("combined"));
app.listen(port, () => console.log(`App is listening on port ${port}.`));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use(function (req, res, next) {
    //console.log(req.path)
    if (req.path !== "/" && req.headers.authorization !== 'Basic bW9odGFzbTptb2h0YXNtMTBRQEA=') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
        res.end('Authentication required.');
    } else {
        next();
    }
});

let isObjectEmpty = (object) => {
    return !object || Object.keys(object).length === 0;
}

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.all('/parser', async function (req, res, next) {
    const { url, html, contentType = "html" } = (!isObjectEmpty(req.body) ? req.body : req.query);
    let r = await Parser.parse(url, { contentType, html });
    return res.send(r);
})

function isString(value) {
    return typeof value === 'string' || value instanceof String;
}
app.use(function (error, req, res, next) {
    const status = error.status || 500;
    const message = error.message || 'Whoops!! something went wrong';
    let d = { status, message };
    if (!isString(error))
        d = { status, message, ...error };
    else {
        d.message = error
    }
    if (!res)
        next();
    else
        res.status(status).json(d);
});
app.use(function (req, res, next) {
    const status = 500;
    const message = 'Whoops!! something went wrong';
    res.status(status).json({ status, message });
});




export default app;