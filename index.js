const express = require('express');
const app = express();
const axios = require('axios');
const https = require('https');
const { carrier, parsePhoneNumberFromString } = require('@devmehq/phone-number-validator-js');
//const { createClient } = require('@supabase/supabase-js');
//const supabase = createClient(process.env.SB_URL, process.env.SB_KEY, { auth: { persistSession: false} });

app.get('/', (req, res) => { res.sendStatus(200); });

app.get('/ping', (req, res) => { res.status(200).json({ message: 'Ping successful' }); });

function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log('Ping successful');
            } else {
                console.error('Ping failed');
            }
        });
    }, 5 * 60 * 1000);
};

app.get('/search', async (req, res) => {
    const { phone } = req.query;
    const mobileNumber = parsePhoneNumberFromString(`+${phone}`)
    //const carrierEN = carrier(mobileNumber)
    const headers = {
        Accept: 'application/json',
        'Accept-Charset': 'UTF-8',
        'Accept-Encoding': 'gzip',
        Connection: 'Keep-Alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'e-auth': process.env.E_AUTH,
        'e-auth-c': process.env.E_AUTH_C,
        'e-auth-k': process.env.E_AUTH_K,
        'e-auth-v': process.env.E_AUTH_V,
        Host: process.env.HOST,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    };

    const result = {};

    const requests = [
        axios.get(`https://${process.env.HOST}/app/getnames.jsp?cli=${mobileNumber.countryCallingCode}${mobileNumber.nationalNumber}&lang=en&is_callerid=true&is_ic=true&cv=vc_496_vn_4.0.496_a&requestApi=okHttp&source=MenifaFragment`, { headers: headers })
        .catch((error) => { return { data: [{ name: "غير موجود" }] };}),
        axios.get(`https://${process.env.HOST2}/contactsearch?cpn=%2B${mobileNumber.countryCallingCode}${mobileNumber.nationalNumber}&myp=${process.env.MYP}&tk=${process.env.TK}&cvc=2100`)
        .catch((error) => { return { data: { name: "غير موجود" } }; })
      ];

    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
        switch (index) {
            case 0: // Source1
            var shaped = {
                name: response.data[0] && response.data[0].name || "غير موجود"
            };
            result['source1'] = shaped;
            break;
            case 1: // Source2
            var shaped = {
                name: response.data && response.data.name || "غير موجود"
            };
            result['source2'] = shaped;
            break;
        }
    });
    res.json(result);  
});

app.listen(3000, () => {
    console.log(`App is on port : 3000`);
    keepAppRunning();
});