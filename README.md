# Temperature REST API
 # 1. Software requirement
  1. Postgres Database -> https://www.postgresql.org/download/
  2. Node v16.14.0
  3. All packages from package.json 
  4. postman client
  
  # Test Instruction
    1. Update DB credentialas per your system, Make sure we have 2 table (Log, User) in DB(will created during first run) 
    2. Load some user data in User table (Manually)
    3. Make sure we have some user date with "admin" role
    4. Refer the Diagram included in this folder
    5. To perform CRUD operation use postman 
    6. Also Swagger build for this project can be used
    7. To run the serve-> nodemon server.js
    8. API: refer to swagger -> http://localhost:3000/api-docs/
       # POST -> http://localhost:3000/api/
       # GET -> http://localhost:3000/api/{username}
       # GET Stats -> http://localhost:3000/api/{username}/stats
       # DELETE-> http://localhost:3000/api/{username}/{logId}
       # PUT-> http://localhost:3000/api/{username}/{logId}
    
   # Stories Covered
   1. All stories covered
   2. Also  API documentation is done -> http://localhost:3000/api-docs/
   
   # Not Covered
   1. Unit tests
   2. Use of Docker/Containers 
       
