import express, {Router} from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swisseph from 'swisseph';
import eph_params from './eph_params.js';
import serverless from "serverless-http";

const api = express();
const router = Router();
swisseph.swe_set_ephe_path('./ephe');
const flag = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;


api.use(bodyParser.urlencoded({ extended: false }));
api.use(bodyParser.json());
api.use(cors());

router.post("/api/horo/", async function (req, res) {
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

api.use("/api/", router);

export const handler = serverless(api);