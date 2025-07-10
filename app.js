const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const swisseph = require('swisseph');
const eph_params = require('./eph_params.js');
import serverless from "serverless-http";

swisseph.swe_set_ephe_path('./ephe');
const flag = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/api/horo/", async function (req, res) {
    const date = new Date(req.body.date);
    const bodies = req.body['bodies[]'];
    let result = {};
    await swisseph.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), swisseph.SE_GREG_CAL ,async function(julday_ut) {
        julday_ut += date.getMinutes() / (24 * 60);
        for(let i = 0; i < bodies.length; i++) {
            const name = bodies[i];
            const param = eph_params[name];
            try {
                await swisseph.swe_calc_ut(julday_ut, param, flag, function(body){
                    result[name] = body.longitude;
                });
            } catch (ex) {
                result[name] = null;
            }
        };
    });
    res.json(result);
});

export const handler = serverless(api);