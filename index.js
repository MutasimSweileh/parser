import express from 'express';
//import Parser from '@postlight/parser';
import Parser from '@postlight/mercury-parser';
import logger from 'logops';
import morgan from 'morgan';

import { Readability } from "@mozilla/readability"
import { JSDOM, VirtualConsole } from "jsdom"

const app = express()


const port = process.env.PORT || 3000;

//app.use(expressLogging(logger));
app.listen(port, () => console.log(`App is listening on port ${port}.`));
app.use(morgan("combined"));
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

// app.get('/', function (req, res) {
//     res.send('Hello World')
// })
async function get_html(url) {
    let response = await JSDOM.fromURL(url);
    return response.serialize()
}
app.all('/parser', async function (req, res, next) {
    let { url, html, contentType = "html", type = "readability" } = (!isObjectEmpty(req.body) ? req.body : req.query);
    let r = null;
    try {
        if (!html)
            html = await get_html(url)
        if (type == "postlight") {
            r = await Parser.parse(url, { contentType, html });
            if (r.error)
                throw new Error(r.message);
        } else {
            const doc = new JSDOM(html, {
                url
            }).window.document;
            const reader = new Readability(doc, { debug: false });
            r = reader.parse()
            if (!r || !r.textContent) {
                throw new Error("Could not parse the page.");
            }
            r.word_count = countWords(r.textContent);
        }
        r = { "success": true, "data": r };
    } catch (error) {
        error = (!isString(error) ? { "message": error.message, "code": error.code } : { "message": error });
        r = { "success": false, ...error };
    }
    return res.send(r);
})
function countWords(s) {
    s = s.replace(/(^\s*)|(\s*$)/gi, "");//exclude  start and end white-space
    s = s.replace(/[ ]{2,}/gi, " ");//2 or more space to 1
    s = s.replace(/\n /, "\n"); // exclude newline with a start spacing
    return s.split(' ').filter(function (str) { return str != ""; }).length;
    //return s.split(' ').filter(String).length; - this can also be used
}
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