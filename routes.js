import express from "express";
import {client} from './index.js'
const routeForStudent = express.Router();
const routeForMentor = express.Router();



// routes For Student

// get all students

routeForStudent
.route('/')
.get(async (req, res)=>{
    if(req.query.isMentored === 'true'){
        let studentData = await client
        .db("mentoralot")
        .collection("students")
        .find({mentoralot: true})
        .toArray()

    res.send({result:true, category:"only assigned students", data: studentData, totalStudents : studentData.length})
    }else if(req.query.isMentored === 'false'){
        let studentData = await client
        .db("mentoralot")
        .collection("students")
        .find({mentoralot: false})
        .toArray()

    res.send({result:true, category:"only unassigned students", data: studentData, totalStudents : studentData.length})
    }else{
    let studentData = await client
        .db("mentoralot")
        .collection("students")
        .find()
        .toArray()

    res.send({result:true, category:"all students",data: studentData, totalStudents : studentData.length})
}
})


// get unassigned students
routeForStudent
.route('/unassign')
.get(async (req, res)=>{
    let studentData = await client
        .db("mentoralot")
        .collection("students")
        .find({mentoralot: false})
        .toArray()

    res.send({data: studentData, totalStudents : studentData.length})
})



// get by name

routeForStudent
.route('/:name')
.get(async (req, res)=>{
    let name = req.params.name
    let studentData = await client
        .db("mentoralot")
        .collection("students")
        .find({studentName : name})
        .toArray()

    studentData.length === 0? res.status(400).send({message:"invalid"}) : res.send({result: true, data: studentData})
})


// assign a mentor for student 
// select one student and assign one mentor
.put(async (req, res)=>{
    let mentorData = req.body

    let [studentData] = await client
        .db("mentoralot")
        .collection("students")
        .find({studentName : req.params.name})
        .toArray()
    let [mentor] = await client
            .db("mentoralot")
            .collection('mentors')
            .find({mentorName : req.body.mentorName })
            .toArray()
    
    if(!studentData.mentoralot){
        let assignMentor = await client
        .db("mentoralot")
        .collection("students")
        .updateOne({studentName: req.params.name },{$set : {mentorDetails:{...mentorData},mentoralot: true } }) 
        
        let stuForMen = [...mentor.students, {studentName : studentData.studentName, studentId : studentData.studentId, name : studentData.name } ]

        let assignStudent = await client
        .db("mentoralot")
        .collection('mentors')
        .updateOne({mentorName : req.body.mentorName}, {$set : { students: stuForMen, numOfStudents : stuForMen.length} })        

        let [student] = await client
        .db("mentoralot")
        .collection("students")
        .find({studentName : req.params.name})
        .toArray()

        res.send({result: true, response : {assignMentor, assignStudent}, data : student })
    }else{res.status(400).send({result : false, message: "invalid"})}
})




// crate a student

routeForStudent
.route('/create')
.post(async (req, res)=>{
    let studentName = req.body.studentName.toLowerCase();
    let students = await client
    .db("mentoralot")
    .collection("students")
    .find()
    .toArray()
    
    let studentValidName = studentName.split(' ').join('') // studentValidName is nothing but a studentName without space

    let checkStudent = students.filter(student=> student.studentName === studentValidName )
    checkStudent = checkStudent.length === 0 ? true : false

    if(checkStudent){
        let dbResponse = await client
            .db("mentoralot")
            .collection("students")
            .insertOne({...req.body, studentId: `220${students.length+1}`, studentName: studentValidName, mentoralot : !req.body.mentorDetails? false : true})
        
            let data = await client
            .db("mentoralot")
            .collection("students")
            .find({studentId: `220${students.length+1}`})
            .toArray()

        res.status(200).send({status: true, response : dbResponse, data})

    }else{ 
        res.status(400).send({message : "invalid"})
    }
})







export const studentsRouter = routeForStudent



//  routes For Mentor

//  get mentors

routeForMentor
.route('/')
.get(async (req, res)=>{
    let query = req.query
    console.log(query)
    if(query.housefull === 'true'){
        let mentorData = await client
        .db("mentoralot")
        .collection("mentors")
        .find({houseFull : true})
        .toArray()
        
        res.status(200).send({result: true , category: "only housefulled mentors", data: mentorData, totalMentors : mentorData.length})
    }else if(query.housefull === 'false') {
        let mentorData = await client
        .db("mentoralot")
        .collection("mentors")
        .find({houseFull : false})
        .toArray()
        
        res.status(200).send({result: true , category: "availabled mentors", data: mentorData, totalMentors : mentorData.length})
    }else{
        let mentorData = await client
        .db("mentoralot")
        .collection("mentors")
        .find()
        .toArray()
        
        res.status(200).send({result:true , category: "all mentors", data: mentorData, totalMentors : mentorData.length})
    }
})

//  get mentor by name

routeForMentor
.route('/:name')
.get(async (req, res)=>{
    let mentorData = await client
    .db("mentoralot")
    .collection("mentors")
    .find({mentorName : req.params.name })
    .toArray()
    
    res.status(200).send({result: true, data: mentorData})
})
.put(async (req, res)=>{
    let studentData = req.body

    let [mentorData] = await client
        .db("mentoralot")
        .collection("mentors")
        .find({mentorName : req.params.name})
        .toArray() 
    
       studentData.forEach(async student =>{ 
        let assignMentor = await client
        .db("mentoralot")
        .collection("students")
        .updateOne({studentName: student.name },{$set : {mentorDetails:{mentorId : mentorData.mentorId, mentorName : mentorData.mentorName, name : mentorData.name},mentoralot: true } }) 
        })
        let stuForMen = [...mentorData.students, ...studentData ]

        let assignStudent = await client
        .db("mentoralot")
        .collection('mentors')
        .updateOne({mentorName : req.params.name}, {$set : { students: stuForMen, numOfStudents : stuForMen.length} })        

        let [mentor] = await client
        .db("mentoralot")
        .collection("mentors")
        .find({mentorName : req.params.name})
        .toArray()

        res.send({result: true, response : { assignStudent}, data : mentor })
    // }res.status(400).send({result : false, message: "invalid"})}
})

routeForMentor
.route('/students/:mentorname')
.get(async (req, res)=>{
    let name = req.params.mentorname
    let studentData = await client
        .db("mentoralot")
        .collection("mentors")
        .find({mentorName : name})
        .toArray()

    studentData.length === 0? res.status(400).send({message:"invalid"}) : res.send({result: true, data: studentData[0].students})
})


//  create mentor
routeForMentor
.route('/create')
.post(async (req, res)=>{
    let mentorName = req.body.mentorName.toLowerCase()
    let mentors = await client
    .db("mentoralot")
    .collection("mentors")
    .find()
    .toArray()

    let mentorValidName = mentorName.split(' ').join('') // mentorValidName is nothing but a mentorName without space

    let checkMentor = mentors.filter(mentor=> mentor.mentorName === mentorValidName )
    checkMentor = checkMentor.length === 0 ? true : false

    if(checkMentor){
        let dbResponse = await client
            .db("mentoralot")
            .collection("mentors")
            .insertOne({...req.body, mentorId: `10220${mentors.length+1}`, mentorName : mentorValidName, numOfStudents : req.body.students.length, houseFull: req.body.students.length >= req.body.maxOfMen? true : false  })
        
        let data = await client
            .db("mentoralot")
            .collection("mentors")
            .find({mentorId: `10220${mentors.length+1}`})
            .toArray()

        res.status(200).send({status: true, response : dbResponse, data})
    }else{ 
        res.status(400).send({message : "invalid"})
    }
})


export const mentorsRouter = routeForMentor