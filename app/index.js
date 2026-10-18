const express = require('express');
/*In order to receive data in a specific format, we use a module called Body parser.It allows
us to receive json data within the poster class withing our express application */
const bodyParser = require('body-parser');
const Blockchain = require("../blockchain");
const P2pServer = require('./p2p-server');

/*Now if we want to run multiple instances of the application on one machine, they won't
be able to share the same port.Thus we need a way to specify different ports to run our code
and our applications through the command line. The below command ensures that if no
environment variable is provided, it can run on the default port.
ex: $HTTP_PORT = 3002 npm run dev. */

HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
const bc = new Blockchain();
const p2pServer = new P2pServer(bc);


//THe below code is for parser only.
app.use(bodyParser.json());//This allows to receive json within post request.
//The code for parser ends here.

//The first post request method:
app.post('/mine', (req,res) => {
    //Even though i have not mentioned mine anywhere, the above function says that
    //if client sends a post request to the /mine URL, call the functions.

    const block = bc.addBlock(req.body.data);/*When users make a post request to this end point,
    express will automatically, create a body object for this request and the body object
    contains all the data that the user sent.*/

    console.log(`New block added :${block.toString()}`);
    p2pServer.syncChains();


    /*Now, we can also respond back with the updated chain of blocks that includes the users
    new block within the data. So for this, we have to redirect to the endpoint to get the
    same res.json.bcChain response. */

    res.redirect('/blocks');
})




/*Now we can add the first endpoint for the API that interacts with this blockchain
instance. An API endpoint is a specific functionality of the application the clients are
using. Each endpoint corresponds to a specific operation or resource. */

app.get('/blocks',(req, res) => {
    res.json(bc.chain);
});

app.listen(HTTP_PORT,()=>console.log(`Listening on port ${HTTP_PORT}`));

p2pServer.listen();
