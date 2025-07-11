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

router.post("/horo/", async function (req, res) {const date = new Date(req.body.date);
    const bodies = req.body['bodies[]'];
    const longitude = parseFloat(req.body['geo[longitude]']);
    const latitude = parseFloat(req.body['geo[latitude]']);
    console.log(longitude);
    console.log(latitude);
    if(date.toString() === 'Invalid Date') {
      throw new Error(403);
    }
    console.log(date);
    console.log(bodies);
    let result = {};
    let julday_ut = await swisseph.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), swisseph.SE_GREG_CAL);
    julday_ut += date.getMinutes() / (24 * 60);
    let house = {};
    for(let i = 0; i < bodies.length; i++) {
        const name = bodies[i];
        const param = eph_params[name];
        if(name === 'vertex' || name === 'part of fortune') {
            house = await swisseph.swe_houses(julday_ut, latitude, longitude, 'P');
            result[name] = {longitude: house.vertex};
        } else {
            try {
                const body = await swisseph.swe_calc_ut(julday_ut, param, flag);
                result[name] = body;
            } catch (ex) {
                console.log(ex);
                result[name] = null;
            }
        }
    }

    // パートオブフォーチュン
    if(bodies.indexOf('part of fortune') !== -1) {
        let asc = house.ascendant;
        let sun = result['sun'].longitude;
        
        if(sun < asc) {
            sun += 360;
          }
          // 昼生まれ
          if ((sun - asc) > 180) {
              var lon =
              asc + result['moon'].longitude - result['sun'].longitude;
              if(lon < 0) lon += 360;
              lon %= 360;
              result['part of fortune'] = {longitude: lon};
          }
          // 夜生まれ
          else {
              var lon =
              asc + result['sun'].longitude - result['moon'].longitude;
              if(lon < 0) lon += 360;
              lon %= 360;
              result['part of fortune'] = {longitude: lon};
          }
    }

    res.json(result);
});

api.use("/api/", router);

export const handler = serverless(api);
