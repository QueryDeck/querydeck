software requirement  : 
 - postgres psql 
 - bash  
 - mongodb   



 create mongdb database with username and password <br>
  1) switch to  your database <br> 
      use my_db

 2) create username and password in that db <br>
 db.createUser(
   {
     user: "db_user_name",
     pwd: "db_password",  
     roles: [ 
 
       { role: "dbOwner" , db: "my_db" } 
     ]
   }
 );

 3) command to connect with username and password  <br>
 mongosh    'mongodb://db_user_name:db_password@localhost:27017/my_db?retryWrites=true&w=majority' 


