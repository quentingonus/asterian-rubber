const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const fs = require('fs');


const app = express();

app.use(bodyParser.json());
app.use(cors());

let member_arr = [];
let data_arr = {};
let con = null;
let create_con = function(){
    let tmpcon = mysql.createConnection({
        host: "asterian.dev",
        user: "admin_quentin",
        password: "Pressanykey55555",
        database: "admin_rubber",
        multipleStatements: true
    });
    tmpcon.on('error', err=>{
        console.log("Connection Lost");
    });
    return tmpcon;
}

let insert_to_name_db = (name)=>{
    con = create_con();
    query = `CREATE TABLE IF NOT EXISTS name (id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, name varchar(255))`;
    con.query(query);
    query = `INSERT INTO name (name) VALUES ('${name}')`;
    con.query(query, (error, result, field)=>{
        if(error){
            console.log(error);
        }
    });
};

let insert_to_data_db = (date, data)=>{    
    con = create_con();
    // create daily table
    let query = `CREATE TABLE IF NOT EXISTS ${date} (id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, name varchar(255), both_weight float(1), one_weight float(1), DRC float(2) DEFAULT NULL)`;
    con.query(query);  
    //create date table
    query = `CREATE TABLE IF NOT EXISTS date_db (id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, date varchar(255) UNIQUE)`;
    con.query(query);
    //insert into date table if not exist
    query = `INSERT INTO date_db (date) VALUES ('${date}')`;
    con.query(query, (error, result, field)=>{
        if(error){
            console.log("Skipped Duplicate");
        }
    });
    //insert into daily table
    query = `INSERT INTO ${date} (name, both_weight, one_weight) VALUES ('${data.name}', '${data.both_weight}', '${data.one_weight}')`;  
    con.query(query);
}

let get_name_from_db = (callback)=>{
    con = create_con();
    let tmp_name_arr = [];
    let query = `SELECT * from name`;
    con.query(query, (err, result)=>{
        Object.keys(result).forEach(item=>{
            tmp_name_arr.push(result[item].name);
        });
        get_date_from_db(tmp_name_arr, callback);
    });
}
let get_date_from_db = (tmp_name_arr, callback)=>{
    let date_list = [];
    let query = `SELECT * from date_db`;
    con.query(query, (err, result)=>{
        Object.keys(result).forEach(item=>{
            date_list.push(result[item].date);
        });
        get_data_from_db(tmp_name_arr, date_list, callback);
    });
}

let get_data_from_db = (tmp_name_arr, date_list, callback)=>{
    let tmp_data_arr = {};
    let query = "";
    date_list.forEach(date_once=>{
        query += `SELECT * from ${date_once};`;
    });
    con.query(query, (err, result)=>{
        for(let i = 0 ; i < date_list.length ; i++){
            let date_optimized = date_list[i];
            tmp_data_arr[date_optimized.replace(/_/g, '-')] = result[i];
        }
        return callback(tmp_name_arr, tmp_data_arr);
    });
}

get_name_from_db((name_arr, data_arr_1)=>{
    member_arr = name_arr;
    data_arr = data_arr_1;
});

app.get('/data',(req, res)=>{
    res.send({member_arr, data_arr});
});

app.post('/addname', (req, res)=>{
    let {name} = req.body;
    if(!(member_arr.includes(name))){
        member_arr.push(name);
        insert_to_name_db(name);
    }
    res.status(201).send({
        member_arr
    });
});

app.post('/adddata', (req, res)=>{
    let {req_data, req_date} = req.body;
    let db_date = req_date.replace(/-/g, "_");
    const single_data = data_arr[req_date] || [];
    single_data.push(req_data);
    data_arr[req_date] = single_data;
    insert_to_data_db(db_date, req_data);
    res.status(201).send(data_arr);
});

app.post('/update', (req, res)=>{
    let {req_data, req_date, index_in_obj} = req.body;
    let db_date = req_date.replace(/-/g, "_");
    ((data_arr[req_date])[index_in_obj]).name = req_data.name;
    ((data_arr[req_date])[index_in_obj]).both_weight = req_data.both_weight;
    ((data_arr[req_date])[index_in_obj]).one_weight = req_data.one_weight;
    ((data_arr[req_date])[index_in_obj]).DRC = req_data.DRC;
    res.status(201).send(data_arr);
    let query = `UPDATE ${db_date} SET name='${req_data.name}', both_weight='${req_data.both_weight}', one_weight='${req_data.one_weight}', DRC='${req_data.DRC}' where name='${req_data.name}'`;
    con = create_con();
    con.query(query, (err, res)=>{
        if(err){
            console.log(err);
        }else{
            console.log(res);
        }
    });
    get_name_from_db((name_arr, data_arr_1)=>{
        member_arr = name_arr;
        data_arr = data_arr_1;
    });
});

const port = process.env.PORT || 7777;
app.listen(port,
    () => console.log("Server is running on ", port));