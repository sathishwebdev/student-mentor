import express from 'express'
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import cors from  'cors'
import {studentsRouter, mentorsRouter} from './routes.js'

dotenv.config()
const app = express()
let PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cors())
// mongo db config
const MONGO_URL = process.env.DB_URL

 // create db connection 

 async function createConnection(){
    const client = new MongoClient(MONGO_URL);
    await client.connect()
    console.log("I got the Database, Boss.")
    return client
    }

 export  const client = await createConnection();

 


app.use('/students', studentsRouter)
app.use('/mentors', mentorsRouter)

app.put('/auto-assign', async (req, res)=>{
    const students = await client
        .db('mentoralot')
        .collection('students')
        .find()
        .toArray(), 
        mentors = await client
        .db("mentoralot")
        .collection("mentors")
        .find()
        .toArray()

    let i = 0  // initialize the loop with 0 @ start
    let S = students.length // number of students
    let M = mentors.length // number of menotrs
    let num = S/M // number of students gonna assign per mentor
    let menCop = mentors
    let stuCop = students
   let result =[]
    // logic loop

    menCop.forEach( ({name, mentorId, mentorName,students})=>{ // mentor loop 2 time
        let dataForMentor = [...students]
        // student loop 4 times
        for(let stuLoop = i ;stuLoop< i + num; stuLoop++){
            dataForMentor.push({name : stuCop[i].name, studentId : stuCop[i].studentId, studentName : stuCop[i].studentName})
            
            let updateStudent =  client
                .db('mentoralot')
                .collection('students')
                .updateOne({studentId : `220${stuLoop}`},{$set: {mentorDetails : {name, mentorId, mentorName}, mentoralot : true}})

  

        }

        let updateMentor =  client
        .db('mentoralot')
        .collection('mentors')
        .updateOne({mentorId}, {$set:{students: dataForMentor, numOfStudents: dataForMentor.length}})

        i = i+num
       
    })
    
    
res.send({message: "auto assign done"})
        
})

app.listen(PORT, ()=>{console.log("Server started at " + PORT)})