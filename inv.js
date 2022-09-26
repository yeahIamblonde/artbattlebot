const {parsePaymentRequest} = require('invoices');

try {
const requestDetails = parsePaymentRequest({request: 'lnbc250s9thpp528y9q6ya4ccc385d6w8v74wszq7cvfxp9hf3xl4sdqqxq9p5hsqrzjqtqkejjy2c44jrwj08y5ygqtmn8af7vscwnflttzpsgw7tuz9r40lshs23wcgwxumcqqqqqqqqqqqqqqpysp5qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5z5tpwxqergd3c8g7rusq9qypqsq0td9t5yaqxsjard7r3mf8qamwwyv79egwfelveg6ljrvtvre4wpxjgdk04f8999nmvwvlaxcj3lg2hpp973v7jgmm6h880n8l5c7p2gq7ce9m9'})
console.log(requestDetails)
} catch(e) {
    console.log('error')
}


