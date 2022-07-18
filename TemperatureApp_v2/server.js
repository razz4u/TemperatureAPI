const express = require("express");
const request = require("request");
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const db = require('./config/database');
const Log = require("./models/Log");
const User = require("./models/User");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Temperature API",
            version: '1.0.0',
        },
    },
    apis: ["server.js"],
};

const app = express()

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

const PORT = process.env.PORT || 3000
const TIME_GAP = 60000

app.listen(PORT, () => console.log('Server is running on port : ' + PORT));
app.use(express.json())

const usrTimeMap = new Map();

app.get("/api/", (req, res) => {
    res.send('Hello, testing temperatue APP21');
});

/**
 * @swagger
 * /api/{username}:
 *   get:
 *     description: Get all the logs recorded by this user or all recods by admin
 *     parameters:
 *      - name: username
 *        decription: user for which the data to be updated
 *        in: path
 *        required : true
 *        type: string 
 * 
 *     responses:
 *       200:
 *         description: Success
 * 
 */

app.get('/api/:username', async (req, res) => {
    const username = req.params.username
    let records;
    console.log(JSON.stringify(username));
    const role = await User.findOne({
        where: {
            name: username
        },
        attributes: ['role']
    })
    const where = role.role !== 'admin' ? { name: username } : {}

    //console.log("Role: " + JSON.stringify(role))
    try {
        records = await Log.findAll(
            {
                include: [{
                    model: User,
                    where: where,
                    attributes: ['name', 'station']
                }]
            }
        )
        console.log(JSON.stringify(username));
        console.log(JSON.stringify(records));
        if (records.length == 0) {
            res.status(404)
        } else {
            res.status(200)
        }
        res.send(records);
    } catch (error) {
        res.status(500)
        res.send("Failed to fetch record: " + error);
    }
});


/**
 * @swagger
 * /api/{username}/stats:
 *   get:
 *     description: Get stats(high,low,avg,median) of temp of all the logs recorded by this user or all recods by admin
 *     parameters:
 *      - name: username
 *        decription: user for which the data to be updated
 *        in: path
 *        required : true
 *        type: string 
 * 
 *      - name: startDate
 *        decription: startDate for date range
 *        in: query
 *        required : false
 *        type: string  
 *
*      - name: endDate
 *        decription: user for which the data to be updated
 *        in: query
 *        required : false
 *        type: string   
 * 
 *     responses:
 *       200:
 *         description: Success
 * 
 */

app.get('/api/:username/stats', async (req, res) => {
    const username = req.params.username
    const stats = {}
    let where = {}
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    if (startDate && endDate) {
        where.date = {
            [Op.gt]: startDate,
            [Op.lt]: endDate
        }
    }
    try {
        const records = await Log.findAll(
            {
                include: [{
                    model: User,
                    where: { name: username },
                    attributes: ['name']
                }],
                where: where
            }
        )
        console.log(JSON.stringify(username));
        console.log(JSON.stringify(records));
        if (records.length == 0) {
            res.status(404)
            res.send("No record found")
        } else {
            res.status(200)
            let temp = []
            records.forEach(rec => {
                temp.push(rec.tempvalue)
            })
            temp.sort()
            let len = temp.length
            stats.high = temp[len - 1]
            stats.low = temp[0]
            let middle = Math.floor((len - 1) / 2)
            stats.median = len % 2 == 0 ? temp[middle] : (temp[middle] + temp[middle + 1]) / 2.0
            stats.avg = (temp.reduce((a, b) => a + b, 0)) / len
            res.send(stats);
        }


    } catch (error) {
        res.status(500)
        res.send("Failed to fetch record: " + error);
    }

});


/**
 * @swagger
 * /api/:
 *   post:
 *     description: Create new temperature log
 *     parameters:
 * 
 *      - name: body
 *        in: body
 *        schema:
 *            type: object
 *            properties:
 *                tempval:
 *                    type: string
 *                    format: string
 *                    example: 30°C 
 *                date:
 *                    type: string
 *                    format: string
 *                    example: '2022-10-11' 
 *                username:
 *                    type: string
 *                    format: string
 *                    example: 'test1' 
 *                city:
 *                    type: string 
 *                    format: string
 *                    example: 'Toronto' 
 * 
 * 
 *     responses:
 *       201:
 *         description: Created
 */

app.post("/api/", async (req, res) => {
    payload = req.body
    if (payload.username in usrTimeMap) {
        const prevTime = usrTimeMap[payload.username]
        const diff = (Date.now() - prevTime)
        if (diff < TIME_GAP) {
            res.status(403)
            res.send("Cannot accept this event (wait 1 minute since your last event)")
            return
        } 
    }

    usrTimeMap[payload.username] = Date.now()

    console.log(JSON.stringify(payload));
    let userId;
    try {
        userId = await User.findOne(
            {
                where: { name: payload.username },
                attributes: ['id']
            }
        )
    } catch (error) {
        console.log("ERROR: " + error)
        res.status(400)
        res.send("User not found: " + error)
    }

    console.log('found userid:' + userId.id);
    delete payload.username;
    payload.userId = userId.id;
    console.log(JSON.stringify(payload));
    const diff = payload.tempval.search('°C') >= 0  ? 0 : 32
    payload.tempvalue = parseInt(payload.tempval) + diff
    delete payload.tempval;
    try {
        await Log.create(payload)
        res.status(201)
        res.send("Temperature recorded successfully")
    } catch (error) {
        console.log("ERROR: " + error)
        res.status(500)
        res.send("Failed to create record: " + error)
    }

});


/**
 * @swagger
 * /api/{username}/{id}:
 *   put:
 *     description: update temperature log with id of user "username" (Admin permitted to update other user)
 *     parameters:
 *      - name: username
 *        decription: user for which the data to be updated
 *        in: path
 *        required : true
 *        type: string 
 * 
 *      - name: id
 *        decription: id of record to be updated
 *        in: path
 *        required : true
 *        type: integer 
 *  
 *      - name: body
 *        in: body
 *        schema:
 *            type: object
 *            properties:
 *                tempval:
 *                    type: string
 *                    format: string
 *                    example: 32°C 
 *                    required : false
 *                date:
 *                    type: string
 *                    format: string
 *                    example: '2022-10-11'
 *                    required : false 
 *                username:
 *                    type: string
 *                    format: string
 *                    example: 'test1'
 *                    required : false 
 *                city:
 *                    type: string 
 *                    format: string
 *                    example: 'Toronto'
 *                    required : false 
 *     responses:
 *       200:
 *         description: Sucess
 */
app.put("/api/:username/:id", async (req, res) => {
    const username = req.params.username
    const id = req.params.id
    const payload = req.body

    console.log(id);

    const user = await User.findOne({
        where: {
            name: username
        }
    })
    let updateResult
    let permission;
    if (user.role === 'admin') {
        permission = true
    } else {
        const userId = await Log.findOne({
            where: {
                id: id
            },
            attributes: ['userId']
        })
        console.log("Log user  : " + JSON.stringify(userId));
        console.log("user id : " + user.id);
        console.log("Log user id : " + userId.userId);

        permission = user.id === userId.userId
        console.log("Permission: " + permission);
        
    }

    if (permission) {

        if(payload.tempval) {
            const diff = payload.tempval.search('°C') >= 0 ? 0 : 32
            payload.tempvalue = parseInt(payload.tempval) + diff
            console.log("tempval : " + payload.tempvalue);
            
            delete payload.tempval
        }
        updateResult = await Log.update(payload, {
            where: {
                id: id
            }
        })
       

        res.status(200)
        console.log(JSON.stringify(updateResult))
        res.send(updateResult)

    } else {
        res.status(403)
        res.send("Permission Denied")
    }
})

/**
 * @swagger
 * /api/{username}/{id}:
 *   delete:
 *     description: update temperature log with id of user "username" (Admin permitted to update other user)
 *     parameters:
 *      - name: username
 *        decription: user for which the data to be updated
 *        in: path
 *        required : true
 *        type: string 
 * 
 * 
 *      - name: id
 *        decription: id of record to be updated
 *        in: path
 *        required : true
 *        type: integer 
 * 
 *     responses:
 *       200:
 *         description: Success
 * 
 */

app.delete('/api/:username/:id', async (req, res) => {
    const username = req.params.username
    const id = req.params.id
    //console.log(JSON.stringify(username));
    const user = await User.findOne({
        where: {
            name: username
        }
    })

    let permission;
    if (user.role === 'admin') {
        permission = true
    } else {
        const userId = await Log.findOne({
            where: {
                id: id
            },
            attributes: ['userId']
        })
        //console.log("Log user  : " + JSON.stringify(userId));
        //console.log("user id : " + user.id);
        //console.log("Log user id : " + userId.userId);

        permission = user.id === userId.userId
    }

    //let userId;
    //try {
    //    userId = await User.findOne({
    //        where: { name: username},
    //        attributes: ['id']
    //    })
    //    
    //    console.log("UserId : " + userId.id);
    //    
    //} catch (error) {
    //    console.log("ERROR: " + error)
    //    res.status(400)
    //    res.send("User not found: " + error)
    //}

    try {
        if (permission) {
            const record = await Log.destroy(
                {
                    where: { id: id }
                }
            )
            if (record == 0) {
                res.sendStatus(404)
            } else {
                res.sendStatus(200)
            }
        } else {
            res.sendStatus(403)
        }

    } catch (error) {
        res.sendStatus(500)
        console.log("Failed to fetch record: " + error);
    }

});